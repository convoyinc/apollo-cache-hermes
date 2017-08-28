import { CacheContext } from '../context';
import {
  DynamicField,
  DynamicFieldMap,
  DynamicFieldWithArgs,
  expandEdgeArguments,
  isDynamicFieldWithArgs,
} from '../DynamicField';
import { GraphSnapshot } from '../GraphSnapshot';
import { EntitySnapshot, NodeSnapshot, ParameterizedValueSnapshot, cloneNodeSnapshot } from '../nodes';
import { PathPart } from '../primitive';
import { NodeId, ParsedQuery, Query } from '../schema';
import {
  addNodeReference,
  addToSet,
  hasNodeReference,
  isObject,
  isScalar,
  lazyImmutableDeepSet,
  removeNodeReference,
  walkPayload,
} from '../util';

/**
 * A newly modified snapshot.
 */
export interface EditedSnapshot {
  snapshot: GraphSnapshot;
  editedNodeIds: Set<NodeId>;
}

/**
 * Used when walking payloads to merge.
 */
interface MergeQueueItem {
  containerId: NodeId;
  containerPayload: any;
  visitRoot: boolean;
  edges: DynamicField | DynamicFieldMap | undefined;
}

/**
 * Describes an edit to a reference contained within a node.
 */
interface ReferenceEdit {
  /** The node that contains the reference. */
  containerId: NodeId;
  /** The path to the reference within the container. */
  path: PathPart[];
  /** The id of the node that was previously referenced. */
  prevNodeId: NodeId | undefined;
  /** The id of the node that should be referenced. */
  nextNodeId: NodeId | undefined;
}

/**
 * Builds a set of changes to apply on top of an existing `GraphSnapshot`.
 *
 * Performs the minimal set of edits to generate new immutable versions of each
 * node, while preserving immutability of the parent snapshot.
 */
export class SnapshotEditor {

  /**
   * Tracks all node snapshots that have changed vs the parent snapshot.
   */
  private _newNodes: { [Key in NodeId]: NodeSnapshot | undefined } = Object.create(null);

  /**
   * Tracks the nodes that have new _values_ vs the parent snapshot.
   *
   * This is a subset of the keys in `_newValues`.  The difference is all nodes
   * that have only changed references.
   */
  private _editedNodeIds = new Set<NodeId>();

  /**
   * Tracks the nodes that have been rebuilt, and have had all their inbound
   * references updated to point to the new value.
   */
  private _rebuiltNodeIds = new Set<NodeId>();

  constructor(
    /** The configuration/context to use when editing snapshots. */
    private _context: CacheContext,
    /** The snapshot to base edits off of. */
    private _parent: GraphSnapshot,
  ) {}

  /**
   * Merge a GraphQL payload (query/fragment/etc) into the snapshot, rooted at
   * the node identified by `rootId`.
   */
  mergePayload(query: Query, payload: object): void {
    const parsed = this._context.parseQuery(query);

    // First, we walk the payload and apply all _scalar_ edits, while collecting
    // all references that have changed.  Reference changes are applied later,
    // once all new nodes have been built (and we can guarantee that we're
    // referencing the correct version).
    const referenceEdits = this._mergePayloadValues(parsed, payload);

    // Now that we have new versions of every edited node, we can point all the
    // edited references to the correct nodes.
    //
    // In addition, this performs bookkeeping the inboundReferences of affected
    // nodes, and collects all newly orphaned nodes.
    const orphanedNodeIds = this._mergeReferenceEdits(referenceEdits);

    // At this point, every node that has had any of its properties change now
    // exists in _newNodes.  In order to preserve immutability, we need to walk
    // all nodes that transitively reference an edited node, and update their
    // references to point to the new version.
    this._rebuildInboundReferences();

    // Remove (garbage collect) orphaned subgraphs.
    this._removeOrphanedNodes(orphanedNodeIds);
  }

  /**
   * Walk `payload`, and for all changed values (vs the parent), constructs new
   * versions of those nodes, including the new values.
   *
   * All edits are performed on new (shallow) copies of the parent's nodes,
   * preserving their immutability, while copying the minimum number of objects.
   *
   * Note that edited references are only collected, not applied.  They are
   * returned to be applied in a second pass (`_mergeReferenceEdits`), once we
   * can guarantee that all edited nodes have been built.
   */
  private _mergePayloadValues(query: ParsedQuery, fullPayload: object): ReferenceEdit[] {
    const { entityIdForNode } = this._context;
    const { dynamicEdgeMap } = query.info;

    const queue: MergeQueueItem[] = [{
      containerId: query.rootId,
      containerPayload: fullPayload,
      visitRoot: false,
      edges: dynamicEdgeMap,
    }];
    const referenceEdits: ReferenceEdit[] = [];
    // We have to be careful to break cycles; it's ok for a caller to give us a
    // cyclic payload.
    const visitedNodes = new Set<object>();

    while (queue.length) {
      const { containerId, containerPayload, visitRoot, edges } = queue.pop()!;
      const containerSnapshot = this.getNodeSnapshot(containerId);
      const container = containerSnapshot ? containerSnapshot.node : undefined;

      // Break cycles in referenced nodes from the payload.
      if (!visitRoot) {
        if (visitedNodes.has(containerPayload)) continue;
        visitedNodes.add(containerPayload);
      }
      // Similarly, we need to be careful to break cycles _within_ a node.
      const visitedPayloadValues = new Set<any>();

      walkPayload(containerPayload, container, edges, visitRoot, (path, payloadValue, nodeValue, dynamicEdges) => {
        const payloadIsObject = isObject(payloadValue);
        const nodeIsObject = isObject(nodeValue);
        let nextNodeId = payloadIsObject ? entityIdForNode(payloadValue) : undefined;
        const prevNodeId = nodeIsObject ? entityIdForNode(nodeValue) : undefined;
        const isReference = nextNodeId || prevNodeId;
        // TODO: Rather than failing on cycles in payload values, we should
        // follow the query's selection set to know how deep to walk.
        if (payloadIsObject && !isReference) {
          // Don't re-visit payload values (e.g. cycles).
          if (visitedPayloadValues.has(payloadValue)) {
            const metadata = `Cycle encountered at ${JSON.stringify(path)} of node ${containerId}`;
            throw new Error(`Cycles within non-entity values are not supported.  ${metadata}`);
          }
          visitedPayloadValues.add(payloadValue);
        }

        // Special case: If this is an array value, we DO NOT support writing
        // sparse arrays; and GraphQL servers should be emitting null (by
        // virtue of JSON as a transport).
        if (payloadValue === undefined && typeof path[path.length - 1] === 'number') {
          this._context.warn(
            `Sparse arrays are not supported when writing.`,
            `Treating blank as null in ${containerId} at ${path.join('.')}`,
          );
          payloadValue = null;
        }

        if (isDynamicFieldWithArgs(dynamicEdges)) {
          const edgeId = this._ensureParameterizedValueSnapshot(containerId, path, dynamicEdges, query.variables!);
          // We walk the values of the parameterized edge like any other entity.
          //
          // EXCEPT: We re-visit the payload, in case it might _directly_
          // reference an entity.  This allows us to build a chain of references
          // where the parameterized value points _directly_ to a particular
          // entity node.
          queue.push({ containerId: edgeId, containerPayload: payloadValue, visitRoot: true, edges: dynamicEdges.children });

          // Stop the walk for this subgraph.
          return true;

        // We've hit a reference.
        } else if (prevNodeId || nextNodeId) {
          // If we already know there is a node at this location, we can merge
          // with it if no new identity was provided.
          //
          // TODO: Is this too forgiving?
          if (!nextNodeId && payloadValue) {
            nextNodeId = prevNodeId;
          }

          // The payload is now referencing a new entity.  We want to update it,
          // but not until we've updated the values of our entities first.
          if (prevNodeId !== nextNodeId) {
            // We have spread "path" so that we pass in new array. "path" array
            // will be mutated by walkPayload function.
            referenceEdits.push({ containerId, path: [...path], prevNodeId, nextNodeId });
          }

          // Either we have a new value to merge, or we're clearing a reference.
          // In both cases, _mergeReferenceEdits will take care of setting the
          // value at this path.
          //
          // So, walk if we have new values, otherwise we're done for this
          // subgraph.
          if (nextNodeId) {
            const updateEdge = dynamicEdges instanceof DynamicField ? dynamicEdges.children : dynamicEdges;
            queue.push({ containerId: nextNodeId, containerPayload: payloadValue, visitRoot: false, edges: updateEdge });
          }
          // Stop the walk for this subgraph.
          return true;

        // Arrays are a little special.  When present, we assume that the values
        // contained within the array are the _full_ set of values.
        } else if (Array.isArray(payloadValue)) {
          const payloadLength = payloadValue.length;
          const nodeLength = nodeValue && nodeValue.length;
          // We will walk to each value within the array, so we do not need to
          // process them yet; but because we update them by path, we do need to
          // ensure that the updated entity's array has the same number of
          // values.
          if (nodeLength === payloadLength) return false;

          // We will fill in the values as we walk, but we ensure that the
          // length is accurate, so that we properly handle empty values (e.g. a
          // value that contains only parameterized edges).
          const newArray = Array.isArray(nodeValue) ? nodeValue.slice(0, payloadLength) : new Array(payloadLength);
          this._setValue(containerId, path, newArray);

          // Also remove any references contained within any entries we removed:
          //
          // TODO: Deal with parameterized edges contained by this.
          // TODO: Better abstract this.
          if (payloadLength < nodeLength && containerSnapshot && containerSnapshot.outbound) {
            for (const reference of containerSnapshot.outbound) {
              if (!reference.path) continue;
              if (!pathBeginsWith(reference.path, path)) continue;
              const index = reference.path[path.length];
              if (typeof index !== 'number') continue;
              // This reference exists in the part of the array that we removed.
              if (index >= payloadLength) {
                const newContainerSnapshot = this._ensureNewSnapshot(containerId);
                removeNodeReference('outbound', newContainerSnapshot, reference.id, path);
                const prevTarget = this._ensureNewSnapshot(reference.id);
                removeNodeReference('inbound', prevTarget, containerId, path);
              }
            }
          }

        // All else we care about are updated scalar values.
        } else if (isScalar(payloadValue) && payloadValue !== nodeValue) {
          this._setValue(containerId, path, payloadValue);

        // TODO: Rather than detecting empty objects directly (which should
        // never occur for GraphQL results, and only for custom types), we
        // should be walking the selection set of the query.
        } else if (payloadIsObject && !Object.keys(payloadValue).length && (!nodeIsObject || Object.keys(payloadValue).length)) {
          this._setValue(containerId, path, payloadValue);
        }

        return false;
      });
    }

    return referenceEdits;
  }

  /**
   * Update all nodes with edited references, and ensure that the bookkeeping of
   * the new and _past_ references are properly updated.
   *
   * Returns the set of node ids that are newly orphaned by these edits.
   */
  private _mergeReferenceEdits(referenceEdits: ReferenceEdit[]): Set<NodeId> {
    const orphanedNodeIds: Set<NodeId> = new Set();

    for (const { containerId, path, prevNodeId, nextNodeId } of referenceEdits) {
      const target = nextNodeId ? this.getDataNodeOfNodeSnapshot(nextNodeId) : null;
      this._setValue(containerId, path, target);
      const container = this._ensureNewSnapshot(containerId);

      if (prevNodeId) {
        removeNodeReference('outbound', container, prevNodeId, path);
        const prevTarget = this._ensureNewSnapshot(prevNodeId);
        removeNodeReference('inbound', prevTarget, containerId, path);
        if (!prevTarget.inbound) {
          orphanedNodeIds.add(prevNodeId);
        }
      }

      if (nextNodeId) {
        addNodeReference('outbound', container, nextNodeId, path);
        const nextTarget = this._ensureNewSnapshot(nextNodeId);
        addNodeReference('inbound', nextTarget, containerId, path);
        orphanedNodeIds.delete(nextNodeId);
      }
    }

    return orphanedNodeIds;
  }

  /**
   * Transitively walks the inbound references of all edited nodes, rewriting
   * those references to point to the newly edited versions.
   */
  private _rebuildInboundReferences(): void {
    const queue = Array.from(this._editedNodeIds);
    addToSet(this._rebuiltNodeIds, queue);

    while (queue.length) {
      const nodeId = queue.pop()!;
      const snapshot = this.getNodeSnapshot(nodeId);
      if (!snapshot || !snapshot.inbound) continue;

      for (const { id, path } of snapshot.inbound) {
        if (!path) continue;
        this._setValue(id, path, snapshot.node, false);
        if (this._rebuiltNodeIds.has(id)) continue;

        this._rebuiltNodeIds.add(id);
        queue.push(id);
      }
    }
  }

  /**
   * Transitively removes all orphaned nodes from the graph.
   */
  private _removeOrphanedNodes(nodeIds: Set<NodeId>): void {
    const queue = Array.from(nodeIds);
    while (queue.length) {
      const nodeId = queue.pop()!;
      const node = this.getNodeSnapshot(nodeId);
      if (!node) continue;

      this._newNodes[nodeId] = undefined;
      this._editedNodeIds.add(nodeId);

      if (!node.outbound) continue;
      for (const { id, path } of node.outbound) {
        const reference = this._ensureNewSnapshot(id);
        if (removeNodeReference('inbound', reference, nodeId, path)) {
          queue.push(id);
        }
      }
    }
  }

  /**
   * Commits the transaction, returning a new immutable snapshot.
   */
  commit(): EditedSnapshot {
    const { entityTransformer } = this._context;
    const snapshots = { ...this._parent._values };
    for (const id in this._newNodes) {
      const newSnapshot = this._newNodes[id];
      // Drop snapshots that were garbage collected.
      if (newSnapshot === undefined) {
        delete snapshots[id];
      } else {
        // _newNodes only contains EntityNode
        if (entityTransformer) entityTransformer(this._newNodes[id]!.node);
        snapshots[id] = newSnapshot;
      }
    }

    return {
      snapshot: new GraphSnapshot(snapshots),
      editedNodeIds: this._editedNodeIds,
    };
  }

  /**
   * Retrieve the _latest_ version of a node.
   */
  private getDataNodeOfNodeSnapshot(id: NodeId) {
    const snapshot = this.getNodeSnapshot(id);
    return snapshot ? snapshot.node : undefined;
  }

  /**
   * Retrieve the _latest_ version of a node snapshot.
   */
  private getNodeSnapshot(id: NodeId) {
    return id in this._newNodes ? this._newNodes[id] : this._parent.getNodeSnapshot(id);
  }

  /**
   * Set `newValue` at `path` of the value snapshot identified by `id`, without
   * modifying the parent's copy of it.
   *
   * This will not shallow clone objects/arrays along `path` if they were
   * previously cloned during this transaction.
   */
  private _setValue(id: NodeId, path: PathPart[], newValue: any, isEdit = true) {
    if (isEdit) {
      this._editedNodeIds.add(id);
    }

    const parent = this._parent.getNodeSnapshot(id);
    const current = this._ensureNewSnapshot(id);
    current.node = lazyImmutableDeepSet(current.node, parent && parent.node, path, newValue);
  }

  /**
   * Ensures that we have built a new version of a snapshot for node `id` (and
   * that it is referenced by `_newNodes`).
   */
  private _ensureNewSnapshot(id: NodeId): NodeSnapshot {
    let parent;
    if (id in this._newNodes) {
      return this._newNodes[id]!;
    } else {
      parent = this._parent.getNodeSnapshot(id);
    }

    // TODO: We're assuming that the only time we call _ensureNewSnapshot when
    // there is no parent is when the node is an entity.  Can we enforce it, or
    // pass a type through?
    const newSnapshot = parent ? cloneNodeSnapshot(parent) : new EntitySnapshot();
    this._newNodes[id] = newSnapshot;
    return newSnapshot;
  }

  /**
   * Ensures that there is a ParameterizedValueSnapshot for the given field.
   */
  _ensureParameterizedValueSnapshot(containerId: NodeId, path: PathPart[], edge: DynamicFieldWithArgs, variables: object) {
    const edgeArguments = expandEdgeArguments(edge.args, variables);
    const edgeId = nodeIdForParameterizedValue(containerId, path, edgeArguments);

    // We're careful to not edit the container unless we absolutely have to.
    // (There may be no changes for this parameterized value).
    const containerSnapshot = this.getNodeSnapshot(containerId);
    if (!containerSnapshot || !hasNodeReference(containerSnapshot, 'outbound', edgeId)) {
      // We need to construct a new snapshot otherwise.
      const newSnapshot = new ParameterizedValueSnapshot();
      addNodeReference('inbound', newSnapshot, containerId);
      this._newNodes[edgeId] = newSnapshot;

      // Ensure that the container points to it.
      addNodeReference('outbound', this._ensureNewSnapshot(containerId), edgeId);
    }


    return edgeId;
  }
}

/**
 * Generate a stable id for a parameterized value.
 */
export function nodeIdForParameterizedValue(containerId: NodeId, path: PathPart[], args: object | undefined) {
  return `${containerId}❖${JSON.stringify(path)}❖${JSON.stringify(args)}`;
}

function pathBeginsWith(target: PathPart[], prefix: PathPart[]) {
  if (target.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== target[i]) return false;
  }
  return true;
}
