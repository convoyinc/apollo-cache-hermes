import { Configuration } from '../Configuration';
import { GraphSnapshot } from '../GraphSnapshot';
import { NodeSnapshot } from '../NodeSnapshot';
import { PathPart } from '../primitive';
import { NodeId, Query } from '../schema';
import { isObject, isScalar, lazyImmutableDeepSet, walkPayload } from '../util';

/**
 * A newly modified snapshot.
 */
export interface EditedSnapshot {
  snapshot: GraphSnapshot,
  editedNodeIds: Set<NodeId>
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
  private _newNodes = Object.create(null) as { [Key in NodeId]: NodeSnapshot | undefined };

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
    /** The configuration to use when editing snapshots. */
    private _config: Configuration,
    /** The snapshot to base edits off of. */
    private _parent: GraphSnapshot,
  ) {}

  /**
   * Merge a GraphQL payload (query/fragment/etc) into the snapshot, rooted at
   * the node identified by `rootId`.
   */
  mergePayload(query: Query, payload: object): void {
    // First, we walk the payload and apply all _scalar_ edits, while collecting
    // all references that have changed.  Reference changes are applied later,
    // once all new nodes have been built (and we can guarantee that we're
    // referencing the correct version).
    const referenceEdits = this._mergePayloadValues(query, payload);

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
  private _mergePayloadValues(query: Query, fullPayload: object): ReferenceEdit[] {
    const { entityIdForNode } = this._config;

    const queue = [{ containerId: query.rootId, containerPayload: fullPayload }];
    const referenceEdits = [] as ReferenceEdit[];

    while (queue.length) {
      const { containerId, containerPayload } = queue.pop() as { containerId: NodeId, containerPayload: any };
      const container = this.get(containerId);

      walkPayload(containerPayload, container, (path, payloadValue, nodeValue) => {
        let nextNodeId = isObject(payloadValue) ? entityIdForNode(payloadValue) : undefined;
        const prevNodeId = isObject(nodeValue) ? entityIdForNode(nodeValue) : undefined;

        // TODO: Detect parameterized edges.

        // We've hit a reference.
        if (prevNodeId || nextNodeId) {
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
            referenceEdits.push({ containerId, path, prevNodeId, nextNodeId });
          }

          // Either we have a new value to merge, or we're clearing a reference.
          // In both cases, _mergeReferenceEdits will take care of setting the
          // value at this path.
          //
          // So, walk if we have new values, otherwise we're done for this
          // subgraph.
          if (nextNodeId) {
            queue.push({ containerId: nextNodeId, containerPayload: payloadValue });
          }
          // Stop the walk for this subgraph.
          return true;

        // Arrays are a little special.  When present, we assume that the values
        // contained within the array are the _full_ set of values.
        } else if (Array.isArray(payloadValue)) {
          // We will walk to each value within the array, so we do not need to
          // process them yet; but because we update them by path, we do need to
          // ensure that the updated entity's array has the same number of
          // values.
          if (nodeValue && nodeValue.length === payloadValue.length) return false;

          const newArray = Array.isArray(nodeValue) ? nodeValue.slice(0, payloadValue.length) : [];
          this._setValue(containerId, path, newArray);

        // All else we care about are updated scalar values.
        } else if (isScalar(payloadValue) && payloadValue !== nodeValue) {
          this._setValue(containerId, path, payloadValue);
        }

        return false;
      });
    }

    // The rough algorithm is as follows:
    //
    //   * Initialize a work queue with one item containing this function's
    //     arguments.  { nodeId, selection, payload }
    //
    //   * While there are items in the queue:
    //
    //     * Pop the last item from the queue.
    //
    //     * Fetch the parent's NodeSnapshot for nodeId as parent.
    //
    //     * Walk payload (depth-first?), parent, and selection in
    //       parallel, visiting each property's value:
    //
    //       * If the selection node is parameterized:
    //
    //         * Determine the id of the parameterized value node (probably just
    //           the keys JSON.stringified; maybe also sorted).
    //
    //         * Create a ParameterizedValue node for that id, if missing.
    //
    //         * push a new item into the queue for the newly reached node, and
    //           stop the walk for child nodes.
    //
    //       * If the value is a scalar:
    //
    //         * _setValue
    //
    //       * If the value is an array:
    //
    //         * If the length of the payload and parent arrays disagree:
    //
    //           * Slice the parent's array to the same length as the payload,
    //             and _setValue it.  Arrays are *not* shallow-merged.
    //
    //       * If the value is an object:
    //
    //         * Determine the id of the node (config.entityIdForNode).
    //
    //         * If there is an id, and it differs from the parent's id:
    //
    //           * Ensure that the node that contains the reference is present
    //             in _newNodes (shallow clone the parent's copy it if not).
    //
    //           * Append a ReferenceEdit to be returned.
    //
    //         * In all cases, if there is an id:
    //
    //           * push a new item into the queue for the newly reached node,
    //             and stop the walk for child nodes.
    //
    //   * Return any collected ReferenceEdits.
    //
    // Future improvement: If the cache were to be given (pre-compiled)
    // knowledge of the schema and where entities lie in its hierarchy, we could
    // be more efficient about determining whether a node is an entity.  (If you
    // have access to it, see our private hermes repo, which takes this
    // approach)

    return referenceEdits;
  }

  /**
   * Update all nodes with edited references, and ensure that the bookkeeping of
   * the new and _past_ references are properly updated.
   *
   * Returns the set of node ids that are newly orphaned by these edits.
   */
  private _mergeReferenceEdits(referenceEdits: ReferenceEdit[]): Set<NodeId> {
    // The rough algorithm is as follows:
    //
    //   * For each entry in referenceEdits:
    //
    //     * If prevNodeId:
    //
    //       * Remove the inbound reference from _getOrCreateNew(prevNodeId).
    //
    //       * Remove the outbound reference from the source node.
    //
    //       * If there are no remaining inbound references and the node is not
    //         a root, mark prevNodeId as orphaned.
    //
    //     * If nextNodeId:
    //
    //       * Insert the inbound reference to _getOrCreateNew(nextNodeId).
    //
    //       * Insert the outbound reference to the source node.
    //
    //       * If nextNodeId is present in the orphaned ids, remove it.
    //
    //     * Set the actual reference (to the next node) at path in containerId.
    //
    //   * Return the set of orphaned ids.
    for (const { containerId, path, nextNodeId } of referenceEdits) {
      const target = nextNodeId ? this.get(nextNodeId) : null;
      this._setValue(containerId, path, target);
    }

    return new Set();
  }

  /**
   * Transitively walks the inbound references of all edited nodes, rewriting
   * those references to point to the newly edited versions.
   */
  private _rebuildInboundReferences(): void {
    // The rough algorithm is as follows:
    //
    //   * Create a new queue of node ids from _editedNodeIds - _rebuiltNodeIds.
    //
    //   * Mark all those ids in _rebuiltNodeIds.
    //
    //   * While there are ids in the queue:
    //
    //     * Pop an id off the queue.
    //
    //     * For each inbound reference for that node:
    //
    //       * _setValue to the new version of the node that's referenced, with
    //         isEdit = false.
    //
    //       * If the referenced node is not in _rebuiltNodeIds:
    //
    //         * Push that id on to the queue, and add it to _rebuiltNodeIds.
    //

    for (const nodeId of this._rebuiltNodeIds) {
      this._config.entityIdForNode(nodeId);
    }
  }

  /**
   * Transitively removes all orphaned nodes from the graph.
   */
  private _removeOrphanedNodes(nodeIds: Set<NodeId>): void {
    // The rough algorithm is as follows:
    //
    //   * Create a new set to track visited node ids.
    //
    //   * While there are ids in nodeIds:
    //
    //     * Pop an id off of nodeIds, and mark it visited.
    //
    //     * Set _newNodes[id] = undefined.
    //
    //     * For each of its outbound references:
    //
    //       * Remove the associated inbound reference.
    //
    //       * If they have no more inbound references and is not a root, push
    //         them on the queue.
    //
    for (const nodeId of nodeIds) {
      this._config.entityIdForNode(nodeId);
    }
  }

  /**
   * Commits the transaction, returning a new immutable snapshot.
   */
  commit(): { snapshot: GraphSnapshot, editedNodeIds: Set<NodeId> } {
    const snapshots: { [Key in NodeId]: NodeSnapshot } = { ...(this._parent as any)._values };
    for (const id in this._newNodes) {
      const newSnapshot = this._newNodes[id];
      // Drop snapshots that were garbage collected.
      if (newSnapshot === undefined) {
        delete snapshots[id];
      } else {
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
  private get(id: NodeId) {
    const snapshot = this.getSnapshot(id);
    return snapshot ? snapshot.node : undefined;
  }

  /**
   * Retrieve the _latest_ version of a node snapshot.
   */
  private getSnapshot(id: NodeId) {
    return id in this._newNodes ? this._newNodes[id] : this._parent.getSnapshot(id);
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

    const parent = this._parent.getSnapshot(id);
    const current = this._ensureNewSnapshot(id);
    lazyImmutableDeepSet(current && current.node, parent && parent.node, path, newValue);
  }

  /**
   * TODO: Support more than just entity snapshots.
   */
  private _ensureNewSnapshot(id: NodeId, initialValue?: object): NodeSnapshot {
    let newSnapshot;
    if (id in this._newNodes) {
      const current = this._newNodes[id];
      // We may have deleted the node.
      if (current) return current;
      // If so, we should start fresh.
      newSnapshot = new NodeSnapshot.Entity({});
    } else {
      const parent = this._parent.getSnapshot(id);
      const value = parent ? { ...parent.node } : {};
      const inbound = parent && parent.inbound ? [...parent.inbound] : undefined;
      const outbound = parent && parent.outbound ? [...parent.outbound] : undefined;

      newSnapshot = new NodeSnapshot.Entity(value, inbound, outbound);
    }

    this._newNodes[id] = newSnapshot;
    return newSnapshot;
  }

}
