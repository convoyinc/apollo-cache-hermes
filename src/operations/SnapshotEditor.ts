import { // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
  SelectionSetNode,
} from 'graphql';

import { CacheContext } from '../context';
import { DynamicField, DynamicFieldWithArgs, DynamicFieldMap, isDynamicFieldWithArgs } from '../DynamicField';
import { GraphSnapshot } from '../GraphSnapshot';
import { EntitySnapshot, NodeSnapshot, ParameterizedValueSnapshot, cloneNodeSnapshot } from '../nodes';
import { JsonObject, JsonValue, PathPart, JsonScalar, NestedObject } from '../primitive';
import { NodeId, ParsedQuery, Query } from '../schema';
import {
  FragmentMap,
  addNodeReference,
  addToSet,
  hasNodeReference,
  isObject,
  isScalar,
  lazyImmutableDeepSet,
  removeNodeReference,
  walkPayload,
  get,
} from '../util';

/**
 * A newly modified snapshot.
 */
export interface EditedSnapshot {
  snapshot: GraphSnapshot;
  editedNodeIds: Set<NodeId>;
  writtenQueries: Set<ParsedQuery>;
}

/**
 * Used when walking payloads to merge.
 */
interface MergeQueueItem {
  containerId: NodeId;
  containerPayload: JsonObject;
  visitRoot: boolean;
  fields: DynamicField | DynamicFieldMap | undefined;
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

  /** The queries that were written, and should now be considered complete. */
  private _writtenQueries = new Set<ParsedQuery>();

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
  mergePayload(query: Query, payload: JsonObject): void {
    const parsed = this._context.parseQuery(query);

    // First, we walk the payload and apply all _scalar_ edits, while collecting
    // all references that have changed.  Reference changes are applied later,
    // once all new nodes have been built (and we can guarantee that we're
    // referencing the correct version).
    // const { referenceEdits } = this._mergePayloadValues(parsed, payload);this._mergePayloadValuesUsingSelectionSetAsGuide;
    const { referenceEdits } = this._mergePayloadValuesUsingSelectionSetAsGuide(parsed, payload); this._mergePayloadValues;

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

    // The query should now be considered complete for future reads.
    this._writtenQueries.add(parsed);
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
  private _mergePayloadValues(query: ParsedQuery, fullPayload: JsonObject) {
    const { entityIdForNode } = this._context;

    const queue: MergeQueueItem[] = [{
      containerId: query.rootId,
      containerPayload: fullPayload,
      visitRoot: false,
      fields: query.dynamicFieldMap,
    }];
    const referenceEdits: ReferenceEdit[] = [];
    // We have to be careful to break cycles; it's ok for a caller to give us a
    // cyclic payload.
    const visitedNodes = new Set<object>();

    while (queue.length) {
      const { containerId, containerPayload, visitRoot, fields } = queue.pop()!;
      const containerSnapshot = this.getNodeSnapshot(containerId);
      const container = containerSnapshot ? containerSnapshot.node : undefined;

      // Break cycles in referenced nodes from the payload.
      if (!visitRoot) {
        if (visitedNodes.has(containerPayload)) continue;
        visitedNodes.add(containerPayload);
      }
      // Similarly, we need to be careful to break cycles _within_ a node.
      const visitedPayloadValues = new Set<any>();

      walkPayload(containerPayload, container, fields, visitRoot, (path, payloadValue, nodeValue, dynamicFields) => {
        const payloadIsObject = isObject(payloadValue);
        const nodeIsObject = isObject(nodeValue);
        let nextNodeId = payloadIsObject ? entityIdForNode(payloadValue as JsonObject) : undefined;
        const prevNodeId = nodeIsObject ? entityIdForNode(nodeValue as JsonObject) : undefined;
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

        if (isDynamicFieldWithArgs(dynamicFields)) {
          const fieldId = this._ensureParameterizedValueSnapshot(containerId, [...path], dynamicFields);
          // We walk the values of the parameterized field like any other
          // entity.
          //
          // EXCEPT: We re-visit the payload, in case it might _directly_
          // reference an entity.  This allows us to build a chain of references
          // where the parameterized value points _directly_ to a particular
          // entity node.
          queue.push({
            containerId: fieldId,
            containerPayload: payloadValue as JsonObject,
            visitRoot: true,
            fields: dynamicFields.children,
          });

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
            const nextFields = dynamicFields instanceof DynamicField ? dynamicFields.children : dynamicFields;
            queue.push({ containerId: nextNodeId, containerPayload: payloadValue as JsonObject, visitRoot: false, fields: nextFields });
          }
          // Stop the walk for this subgraph.
          return true;

        // Arrays are a little special.  When present, we assume that the values
        // contained within the array are the _full_ set of values.
        } else if (Array.isArray(payloadValue)) {
          const payloadLength = payloadValue.length;
          const nodeLength = Array.isArray(nodeValue) && nodeValue.length;
          // We will walk to each value within the array, so we do not need to
          // process them yet; but because we update them by path, we do need to
          // ensure that the updated entity's array has the same number of
          // values.
          if (nodeLength === payloadLength) return false;

          // We will fill in the values as we walk, but we ensure that the
          // length is accurate, so that we properly handle empty values (e.g. a
          // value that contains only parameterized fields).
          const newArray = Array.isArray(nodeValue) ? nodeValue.slice(0, payloadLength) : new Array(payloadLength);
          this._setValue(containerId, path, newArray);

        // All else we care about are updated scalar values.
        } else if (isScalar(payloadValue) && payloadValue !== nodeValue) {
          this._setValue(containerId, path, payloadValue);

        // TODO: Rather than detecting empty objects directly (which should
        // never occur for GraphQL results, and only for custom types), we
        // should be walking the selection set of the query.
        } else if (
          payloadIsObject &&
          !Object.keys((payloadValue as NestedObject<JsonScalar>)).length &&
          (!nodeIsObject || Object.keys((payloadValue as NestedObject<JsonScalar>)).length)
        ) {
          this._setValue(containerId, path, payloadValue);
        }

        return false;
      });
    }

    return { referenceEdits };
  }

  private _mergePayloadValuesUsingSelectionSetAsGuide(query: ParsedQuery, fullPayload: JsonObject) {
    const referenceEdits: ReferenceEdit[] = [];
    this._walkSelectionSets(query.info.operation.selectionSet,
      fullPayload,
      /* currentPath */ [],
      query.dynamicFieldMap,
      query.rootId,
      query.info.fragmentMap,
      referenceEdits
    );
    return { referenceEdits };
  }

  // TODO (yuisu) : consider nest this function into _mergePayloadValuesUsingSelectionSetAsGuide
  private _walkSelectionSets(currentSelectionSets: SelectionSetNode,
    prevPayload: JsonValue,
    prevPath: string[] | undefined,
    prevDynamicFieldMap: DynamicFieldMap | undefined,
    containerId: string,
    fragmensMap: FragmentMap,
    referenceEdits: ReferenceEdit[]): void {
      if (!prevPayload) {
        return;
      }
      // TODO (yuisu): parameterized field
      for (const selection of currentSelectionSets.selections) {
        switch(selection.kind) {
          case "Field":
            /**
             * if there is no sub-selectionSet, threat the value as leaf and just point to the payload value.
             * if there exist a child, walk the sub-selectionSet
             */

            // TODO(yuisu): should we be worry about both alias and real field name have payload value?
            // cacheKey is unalias field name
            const cacheKey = selection.name.value;
            const payloadKey = selection.alias ? selection.alias.value : cacheKey;
            const containerSnapshot = this.getNodeSnapshot(containerId);
            let containerNode = containerSnapshot ? containerSnapshot.node : undefined;
            // If prevPath is undefined, we are in the first recursion of the
            // parameterized field with updated containerId. Therefore, do not update
            // currentDynamicFieldMap as it is already updated in the caller.
            // e.g.
            // we encounter below selectionSets
            //   message(count: $count) {
            //     Title: title
            //   }
            // At the selection "message(count: $count)", process it as
            //  paramterized field and recurse the function with
            //    - paramterized containerId;
            //    - prevPath : undefined;
            //    - prevDynamicFieldMap : {
            //        Title: DynamicField(alias: "title"....)
            //      }
            //    - prevPayload: { message: { Title: "Hello world" } }
            const currentDynamicFieldMap = prevPath ?
              get(prevDynamicFieldMap, payloadKey) : prevDynamicFieldMap;

            // If it is parameterized edge, we will want to reprocess it first
            // so that we can set container ID to be parameterized container ID.
            if (isDynamicFieldWithArgs(currentDynamicFieldMap)) {
              const nextNodeId = this._ensureParameterizedValueSnapshot(containerId,
                prevPath ? [...prevPath, cacheKey] : [cacheKey],
                currentDynamicFieldMap
              );
              // Re-entry so that we will create entity correctly
              this._walkSelectionSets(currentSelectionSets,
                prevPayload,
                /* currentPath */ undefined,
                currentDynamicFieldMap.children,
                nextNodeId,
                fragmensMap,
                referenceEdits
              );
              break;
            }

            // This field is a leaf field and does not contain any nested selection sets
            // just reference payload value in the graph snapshot node.
            if (!selection.selectionSet) {
              let nodeValue = prevPayload[payloadKey];
              // Explicitly check for "undefined" as we should
              // persist other falsy value (see: "writeFalsyValues" test).
              if (nodeValue === undefined) {
                // The currentPayload doesn't have the value.
                // Look into containerNode (which can be previous snapshot)
                // for possible reuse value.
                nodeValue = containerNode && containerNode[cacheKey] !== undefined ?
                  containerNode[cacheKey] : null;
              }

              let newPath: string[];
              if (!prevPath) {
                // If The prevPath is undefined means that
                // the current selection is a parameterized itself.
                // e.g : message(count: $count) -> prevPath = undefined
                //
                // we just want to store the value directly on the node
                // because the parameterized key is unique to a
                // particular value.
                newPath = [];
              }
              else {
                // If the prevPath length is greater than zero, then
                // the selection is a non-parameterized field
                // either nested in side other non-parameterized
                // or parameterized field
                //   e.g.
                //     message(count: $count) {
                //       title -> prevPath = [title]
                //     }
                //     message {
                //       title -> prevPath = [message, title]
                //     }
                newPath = [...prevPath, cacheKey];
              }

              // We intensionally do not deep copy the nodeValue as Apollo will then perform
              // Object.freeze anyway. So any change in the payload value afterward will be reflect
              // in the graph as well.
              // We use selection.name.value instead of payloadKey so that we always write
              // to cache using real field name rather than alias name.
              this._setValue(containerId, newPath, nodeValue);
              // TODO(yuisu): check for missing property
              break;
            }

            // This field contains nested selectionSet so recursively walking the sub-selectionSets.
            // We expect to have an object or an array as a payload value. If not, the payload cannot
            // have matching shape as the sub-selectionSets.
            // Check if payload is a object or array, throw an error if it isn't.
            const currentPayload = prevPayload[payloadKey];

            if (isScalar(currentPayload)) {
              // TODO(yuisu): sentry? should we continue and just write null ?
              throw new Error(`Hermes Error: At field-"${payloadKey}",
expected an object or array as a payload but get "${JSON.stringify(currentPayload)}"`);
            }

            const entityIdOfCurrentPayload = this._context.entityIdForNode(currentPayload);
            let nextNodeId = entityIdOfCurrentPayload;

            // A parameterized graph node, the node-value under the
            // parameterized key will be a direct reference to a
            // node value of the corresponding entity GraphNodeSnapshot.
            // e.g.
            //   "ROOT_QUERY❖[\"foo\"]❖{\"id\":1,\"withExtra\":true}"
            //     (node value is a direct reference to node value of "1")
            //   "1": { id: 1, ...}
            // This is because parameterized key can only have one value so
            // there is no need to store another indirection like
            // non-parameterized node
            //
            // A non-parameterized graph node, the node-value under the
            // RootQueryId will be an object in which each key is the
            // selection name with the value be either
            //   - a direct reference to a node value of corresponding
            //     entity GraphNodeSnapshot
            //   - an object (in the case of non-entity).
            // e.g.
            //   "ROOT_QUERY"
            //     node : {
            //      "1": <reference to node value of entity "1">
            //      "2": { ...<some prop of the non-entity> }
            //   "1": { id: 1, ...}
            //
            // Thus, when the prevPath is undefined indicating
            // we just reenter the function with parameterized
            // containerId, we can look directly for prevsousNodeId.
            // For non-parameterized, we will have to do redirection.
            let prevNodeId: NodeId | undefined;
            if (!prevPath) {
              prevNodeId = isObject(containerNode) ?
                this._context.entityIdForNode(containerNode) : undefined;
            }
            else {
              prevNodeId = containerNode && isObject(containerNode[cacheKey]) ?
                this._context.entityIdForNode(containerNode[cacheKey]) : undefined;
            }

            // It is still possible to DynamicField in the case of alias
            const childDynamicMap = currentDynamicFieldMap instanceof DynamicField ?
              currentDynamicFieldMap.children : currentDynamicFieldMap;

            if (nextNodeId || prevNodeId) {
              // TODO(yuisu): error when there is an inconsitent of being entity between new node and previous node
              if (!nextNodeId && prevPayload) {
                nextNodeId = prevNodeId;
              }

              // TODO(yuisu): understand this peice
              let newPath: string[];
              if (prevPath) {
                newPath = [...prevPath, cacheKey];
              }
              else {
                newPath = [];
              }
              if (prevNodeId !== nextNodeId) {
                referenceEdits.push({
                  containerId: containerId,
                  path: newPath,
                  prevNodeId,
                  nextNodeId,
                });
              }
            }

            // CurrentPayload is considered as an entity.
            if (entityIdOfCurrentPayload !== undefined) {
              this._walkSelectionSets(selection.selectionSet,
                currentPayload,
                /* currentPath */[],
                childDynamicMap,
                nextNodeId!,
                fragmensMap,
                referenceEdits
              );
            }
            else {
              // CurrentPayload isnot an entity so we didn't reset the path
              this._walkSelectionSets(selection.selectionSet,
                currentPayload,
                prevPath ? [...prevPath, cacheKey] : [],
                childDynamicMap,
                containerId,
                fragmensMap,
                referenceEdits
              );
            }
            break;
          case "FragmentSpread":
            break;
          case "InlineFragment":
            break;
        }
      }
  }

  /**
   * Update all nodes with edited references, and ensure that the bookkeeping of
   * the new and _past_ references are properly updated.
   *
   * Returns the set of node ids that are newly orphaned by these edits.
   */
  private _mergeReferenceEdits(referenceEdits: ReferenceEdit[]) {
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
  private _rebuildInboundReferences() {
    const queue = Array.from(this._editedNodeIds);
    addToSet(this._rebuiltNodeIds, queue);

    while (queue.length) {
      const nodeId = queue.pop()!;
      const snapshot = this.getNodeSnapshot(nodeId);
      if (!(snapshot instanceof EntitySnapshot)) continue;
      if (!snapshot || !snapshot.inbound) continue;

      for (const { id, path } of snapshot.inbound) {
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
  private _removeOrphanedNodes(nodeIds: Set<NodeId>) {
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
        if (entityTransformer) {
          const { node } = this._newNodes[id] as EntitySnapshot;
          if (node) entityTransformer(node);
        }
        snapshots[id] = newSnapshot;
      }
    }

    return {
      snapshot: new GraphSnapshot(snapshots),
      editedNodeIds: this._editedNodeIds,
      writtenQueries: this._writtenQueries,
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
  _ensureParameterizedValueSnapshot(containerId: NodeId, path: PathPart[], field: DynamicFieldWithArgs) {
    const fieldId = nodeIdForParameterizedValue(containerId, path, field.args);

    // We're careful to not edit the container unless we absolutely have to.
    // (There may be no changes for this parameterized value).
    const containerSnapshot = this.getNodeSnapshot(containerId);
    if (!containerSnapshot || !hasNodeReference(containerSnapshot, 'outbound', fieldId, path)) {
      // We need to construct a new snapshot otherwise.
      const newSnapshot = new ParameterizedValueSnapshot();
      addNodeReference('inbound', newSnapshot, containerId, path);
      this._newNodes[fieldId] = newSnapshot;

      // Ensure that the container points to it.
      addNodeReference('outbound', this._ensureNewSnapshot(containerId), fieldId, path);
    }

    return fieldId;
  }
}

/**
 * Generate a stable id for a parameterized value.
 */
export function nodeIdForParameterizedValue(containerId: NodeId, path: PathPart[], args?: JsonObject) {
  return `${containerId}❖${JSON.stringify(path)}❖${JSON.stringify(args)}`;
}
