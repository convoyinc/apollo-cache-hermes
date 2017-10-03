import { // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
  SelectionSetNode,
} from 'graphql';
import deepFreeze = require('deep-freeze-strict');
import lodashIsEqual = require('lodash.isequal');

import { CacheContext } from '../context';
import { DynamicField, DynamicFieldMap, DynamicFieldWithArgs, isDynamicFieldWithArgs } from '../DynamicField';
import { InvalidPayloadError, OperationError } from '../errors';
import { GraphSnapshot } from '../GraphSnapshot';
import { cloneNodeSnapshot, EntitySnapshot, NodeSnapshot, ParameterizedValueSnapshot } from '../nodes';
import { FieldArguments, ParsedQuery } from '../ParsedQueryNode';
import { JsonArray, JsonObject, JsonValue, nil, PathPart } from '../primitive';
import { NodeId, OperationInstance, RawOperation } from '../schema';
import {
  addNodeReference,
  addToSet,
  deepGet,
  FragmentMap,
  get,
  hasNodeReference,
  isNil,
  isObject,
  isScalar,
  lazyImmutableDeepSet,
  removeNodeReference,
} from '../util';

/**
 * A newly modified snapshot.
 */
export interface EditedSnapshot {
  snapshot: GraphSnapshot;
  editedNodeIds: Set<NodeId>;
  writtenQueries: Set<OperationInstance>;
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
  private _writtenQueries = new Set<OperationInstance>();

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
  mergePayload(query: RawOperation, payload: JsonObject): void {
    const parsed = this._context.parseOperation(query);

    // First, we walk the payload and apply all _scalar_ edits, while collecting
    // all references that have changed.  Reference changes are applied later,
    // once all new nodes have been built (and we can guarantee that we're
    // referencing the correct version).
    const referenceEdits: ReferenceEdit[] = [];
    this._mergeSubgraph(referenceEdits, parsed.rootId, [] /* path */, parsed.parsedQuery, payload);

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
   *
   */
  private _mergeSubgraph(
    referenceEdits: ReferenceEdit[],
    containerId: NodeId,
    path: PathPart[],
    parsed: ParsedQuery,
    payload: JsonValue | undefined,
  ) {
    // Don't trust our inputs; we can receive values that aren't JSON
    // serializable via optimistic updates.
    if (payload === undefined) {
      this._context.warn(`Encountered undefined at ${path.join('.')} of node ${containerId}. Treating as null`);
      payload = null;
    }

    // We should only ever reach a subgraph if it is a container (object/array).
    if (typeof payload !== 'object') {
      throw new InvalidPayloadError(`Received a ${typeof payload} value, but expected an object/array/null`, containerId, path, payload);
    }

    // TODO(ianm): We're doing this a lot.  How much is it impacting perf?
    const previousValue = deepGet(this.getNodeData(containerId), path);

    // Recurse into arrays.
    if (Array.isArray(payload) || Array.isArray(previousValue)) {
      if (!isNil(previousValue) && !Array.isArray(previousValue)) {
        throw new InvalidPayloadError(`Unsupported transition from a non-list to list value`, containerId, path, payload);
      }
      if (!isNil(payload) && !Array.isArray(payload)) {
        throw new InvalidPayloadError(`Unsupported transition from a list to a non-list value`, containerId, path, payload);
      }

      this._mergeArraySubgraph(referenceEdits, containerId, path, parsed, payload, previousValue);
      return;
    }

    const payloadId = this._context.entityIdForValue(payload);
    const previousId = this._context.entityIdForValue(previousValue);

    // Is this an identity change?
    if (payloadId !== previousId) {
      // It is invalid to transition from a *value* with an id to one without.
      if (!isNil(payload) && !payloadId) {
        throw new InvalidPayloadError(`Unsupported transition from an entity to a non-entity value`, containerId, path, payload);
      }
      // The reverse is also invalid.
      if (!isNil(previousValue) && !previousId) {
        throw new InvalidPayloadError(`Unsupported transition from a non-entity value to an entity`, containerId, path, payload);
      }
      // Double check that our id generator is behaving properly.
      if (payloadId && isNil(payload)) {
        throw new OperationError(`entityIdForNode emitted an id for a nil payload value`, containerId, path, payload);
      }

      // Fix references. See: orphan node tests on "orphan a subgraph" The new
      // value is null and the old value is an entity. We will want to remove
      // reference to such entity
      referenceEdits.push({
        containerId,
        path,
        prevNodeId: previousId,
        nextNodeId: payloadId,
      });

      // Nothing more to do here; the reference edit will null out this field.
      if (!payloadId) return;

    // End of the line for a non-reference.
    } else if (isNil(payload) && previousValue !== null) {
      this._setValue(containerId, path, null, true);
      return;
    }

    // If we've entered a new node; it becomes our container.
    if (payloadId) {
      containerId = payloadId;
      path = [];
    }

    // Finally, we can walk into individual values.
    for (const payloadName in parsed) {
      const node = parsed[payloadName];
      // Having a schemaName on the node implies that payloadName is an alias.
      const schemaName = node.schemaName ? node.schemaName : payloadName;
      let fieldValue = deepGet(payload, [payloadName]) as JsonValue | undefined;
      // Don't trust our inputs.  Ensure that missing values are null.
      if (fieldValue === undefined) {
        this._context.warn(`Encountered undefined at ${[...path, payloadName].join('.')} of node ${containerId}. Treating as null`);
        fieldValue = null;
      }

      let containerIdForField = containerId;

      // For static fields, we append the current cacheKey to create a new path
      // to the field.
      //
      //   user: {
      //     name: 'Bob',   -> fieldPath: ['user', 'name']
      //     address: {     -> fieldPath: ['user', 'address']
      //       city: 'A',   -> fieldPath: ['user', 'address', 'city']
      //       state: 'AB', -> fieldPath: ['user', 'address', 'state']
      //     },
      //     info: {
      //       id: 0,       -> fieldPath: ['id']
      //       prop1: 'hi'  -> fieldPath: ['prop1']
      //     },
      //     history: [
      //       {
      //         postal: 123 -> fieldPath: ['user', 'history', 0, 'postal']
      //       },
      //       {
      //         postal: 456 -> fieldPath: ['user', 'history', 1, 'postal']
      //       }
      //     ],
      //     phone: [
      //       '1234', -> fieldPath: ['user', 0]
      //       '5678', -> fieldPath: ['user', 1]
      //     ],
      //   },
      //
      // Similarly, something to keep in mind is that parameterized nodes
      // (instances of ParameterizedValueSnapshot) can have direct references to
      // an entity node's value.
      //
      // For example, with the query:
      //
      //   foo(id: 1) { id, name }
      //
      // The cache would have:
      //
      //   1: {
      //     node: { id: 1, name: 'Foo' },
      //   },
      //   'ROOT_QUERY❖["foo"]❖{"id":1}': {
      //     node: // a direct reference to the node of entity '1'.
      //   },
      //
      // This allows us to rely on standard behavior for entity references: If
      // node '1' is edited, the parameterized node must also be edited.
      // Similarly, the parameterized node contains an outbound reference to the
      // entity node, for garbage collection.
      let fieldPath = [...path, schemaName];
      if (node.args) {
        // The values of a parameterized field are explicit nodes in the graph;
        // so we set up a new container & path.
        containerIdForField = this._ensureParameterizedValueSnapshot(containerId, fieldPath, node.args);
        fieldPath = [];
      }

      // Note that we're careful to fetch the value of our new container; not
      // the outer container.
      const previousFieldValue = deepGet(this.getNodeData(containerIdForField), fieldPath);

      // For fields with sub selections, we walk into them; only leaf fields are
      // directly written via _setValue.  This allows us to perform minimal
      // edits to the graph.
      if (node.children) {
        this._mergeSubgraph(referenceEdits, containerIdForField, fieldPath, node.children, fieldValue);

      // We've hit a leaf field.
      //
      // Note that we must perform a _deep_ equality check here, to cover cases
      // where a leaf value is a complex object.
      } else if (!lodashIsEqual(fieldValue, previousFieldValue)) {
        // We intentionally do not deep copy the nodeValue as Apollo will
        // then perform Object.freeze anyway. So any change in the payload
        // value afterward will be reflect in the graph as well.
        //
        // We use selection.name.value instead of payloadKey so that we
        // always write to cache using real field name rather than alias
        // name.
        this._setValue(containerIdForField, fieldPath, fieldValue);
      }
    }
  }

  private _mergeArraySubgraph(
    referenceEdits: ReferenceEdit[],
    containerId: NodeId,
    path: PathPart[],
    parsed: ParsedQuery,
    payload: JsonArray | nil,
    previousValue: JsonArray | nil,
  ) {
    // TODO(ianm): Clean up references.
    if (isNil(payload)) {
      // Note that we mark this as an edit, as this method is only ever called
      // if we've determined the value to be an array (which means that
      // previousValue MUST be an array in this case).
      this._setValue(containerId, path, null, true);
      return;
    }

    const payloadLength = payload ? payload.length : 0;
    const previousLength = previousValue ? previousValue.length : 0;
    // Note that even though we walk into arrays, we need to be
    // careful to ensure that we don't leave stray values around if
    // the new array is of a different length.
    //
    // So, we resize the array to our desired size before walking.
    if (payloadLength !== previousLength || !previousValue) {
      const newArray = Array.isArray(previousValue)
        ? previousValue.slice(0, payloadLength) : new Array(payloadLength);
      this._setValue(containerId, path, newArray);
    }

    // Note that we're careful to iterate over all indexes, in case this is a
    // sparse array.
    for (let i = 0; i < payload.length; i++) {
      this._mergeSubgraph(referenceEdits, containerId, [...path, i], parsed, payload[i]);
    }
  }

  private _mergePayloadValuesUsingSelectionSetAsGuide(query: OperationInstance, fullPayload: JsonObject) {
    const referenceEdits: ReferenceEdit[] = [];
    this._walkSelectionSets(
      query.info.operation.selectionSet,
      fullPayload,
      /* prevPath */ [],
      query.dynamicFieldMap,
      query.rootId,
      query.info.fragmentMap,
      referenceEdits
    );
    return { referenceEdits };
  }

  /**
   * A helper function that will walk query selection sets recursively and write
   * values into the graph snapshot.
   *
   * TODO(yuisu): consider nesting this function into
   * _mergePayloadValuesUsingSelectionSetAsGuide
   */
  private _walkSelectionSets(
    // a current graphql selection node we are visiting
    currentGraphqlNode: SelectionSetNode,
    // a JSON payload with the shape matching current graphql node
    prevPayload: JsonValue,
    // a array of PathPart that lead to current graphql selection
    prevPath: PathPart[],
    prevDynamicFieldMap: DynamicFieldMap | undefined,
    originalContainerId: string,
    fragmentsMap: FragmentMap,
    referenceEdits: ReferenceEdit[]): void {
    if (prevPayload === undefined) {
      return;
    }

    for (const selection of currentGraphqlNode.selections) {
      let currentContainerId = originalContainerId;
      switch (selection.kind) {
        // If this is a leaf node (no child selection set), the payload's value
        // is treated as a raw value of the graph (even if it's an object).
        //
        // Otherwise, we walk the child selections.
        case 'Field': {
          // TODO(yuisu): should we be worried about cases where there are
          // payload values for both the aliased name and the real name?
          const cacheKey = selection.name.value;
          const payloadKey = selection.alias ? selection.alias.value : cacheKey;
          let currentPayload = prevPayload === null ? prevPayload : prevPayload[payloadKey];
          const currentDynamicFieldMap = get(prevDynamicFieldMap, payloadKey);

          // For static fields, we append the current cacheKey to create a new
          // path to the field.
          //
          //   user: {
          //     name: 'Bob',   -> newPath: ['user', 'name']
          //     address: {     -> newPath: ['user', 'address']
          //       city: 'A',   -> newPath: ['user', 'address', 'city']
          //       state: 'AB', -> newPath: ['user', 'address', 'state']
          //     },
          //     info: {
          //       id: 0,       -> newPath: ['id']
          //       prop1: 'hi'  -> newPath: ['prop1']
          //     },
          //     history: [
          //       {
          //         postal: 123 -> newPath: ['user', 'history', 0, 'postal']
          //       },
          //       {
          //         postal: 456 -> newPath: ['user', 'history', 1, 'postal']
          //       }
          //     ],
          //     phone: [
          //       '1234', -> newPath: ['user', 0]
          //       '5678', -> newPath: ['user', 1]
          //     ],
          //   },
          //

          // Something to keep in mind is that parameterized nodes (instances of
          // ParameterizedValueSnapshot) can have direct references to an
          // entity node's value.
          //
          // For example, with the query:
          //
          //   foo(id: 1) { id, name }
          //
          // The cache would have:
          //
          //   1: {
          //     node: { id: 1, name: 'Foo' },
          //   },
          //   'ROOT_QUERY❖["foo"]❖{"id":1}': {
          //     node: // a direct reference to the node of entity '1'.
          //   },
          //
          // This allows us to rely on standard behavior for entity references:
          // If node '1' is edited, the parameterized node must also be edited.
          // Similarly, the parameterized node contains an outbound reference to
          // the entity node, for garbage collection.

          // TODO(yuisu): ianm is confused by this comment, and doesn't follow:
          //
          //   * for any regular (entity) node, the value of its `node` property
          //     is an object - but that object can refer to any type of value
          //     in its keys (keys 1 & 2 can be scalars in your example below)
          //
          //   * I'm confused about the use of undefined for previousNodeValue.
          //
          // ---
          //
          // A non-parameterized graph node, the node-value under the
          // RootQueryId will be an object in which each key is the
          // selection name with the value be either
          //   - a direct reference to a node value of corresponding
          //     entity GraphNodeSnapshot
          //   - an object (in the case of non-entity).
          // e.g.
          //   'ROOT_QUERY'
          //     node : {
          //      1: <reference to node value of entity "1">
          //      2: { ...<some prop of the non-entity> }
          //   1: { id: 1, ...}
          //
          // Thus, when the prevPath is undefined indicating that
          // we just reenter the function with parameterized
          // containerId, we can look directly for previousNodeValue.
          // For non-parameterized, we will have to do redirection.
          let previousNodeValue: JsonValue | undefined;
          let currentPath: PathPart[];
          // If it is parameterized field, we will want to reprocess it first
          // so that we can set container ID to be parameterized container ID.
          const isParameterizedField = isDynamicFieldWithArgs(currentDynamicFieldMap);
          if (isParameterizedField) {
            currentContainerId = this._deprecatedEnsureParameterizedValueSnapshot(
              currentContainerId,
              [...prevPath, cacheKey],
              currentDynamicFieldMap
            );
            // We reset the path to current field because parameterized fields
            // are explicit nodes in the graph.
            //
            // TODO(ianm): This isn't specific to parameterized fields.  We want
            // this behavior for entity nodes, too.
            //
            // If the current parameterized field is a leaf, we will store the
            // value directly on the node because the parameterized key is
            // unique to a particular value.  E.g.
            //
            //   message(count: $count) -> newPath = []
            //     detailMessage(count: $count) {
            //       title -> newPath = [title]
            //     }
            //   }
            //
            currentPath = [];
            const containerSnapshot = this.getNodeSnapshot(currentContainerId);
            const containerNode = containerSnapshot ? containerSnapshot.node : undefined;
            previousNodeValue = containerNode;
          } else {
            // TODO(ianm): Can we handle missing/null values sooner, so we're
            // not special casing prevPath & currentPath like this?
            //
            // If the prevPayload value is a top element in the array and is
            // null, just write out 'null' as an element instead of wrapping it
            // in the object.  E.g.
            //
            //   articles: [
            //     null, -> selection will be 'title' when visiting this element
            //     {
            //       title: 10,
            //       body: 'hello',
            //     },
            //   ],
            //
            // Snapshot values should be : [null, { title: 10, body: 'hello' }]
            if (typeof prevPath[prevPath.length - 1] === 'number' && prevPayload === null) {
              currentPath = [...prevPath];
            } else {
              currentPath = [...prevPath, cacheKey];
            }
            const containerNode = this.getNodeData(currentContainerId);
            previousNodeValue = deepGet(containerNode, currentPath);
          }

          // Only trying to get previousNodeId if the current select is expect
          // to be an object and possible should be treat as entity.  E.g.
          //
          //  query: { foo }
          //  previous: { foo: { id: 0, name: 'Foo' } }
          //  current: null
          //
          // We don't want to treat previousValue as an entity for at above case
          // and get its Id.
          const previousNodeId = isObject(previousNodeValue) && selection.selectionSet
            ? this._context.entityIdForValue(previousNodeValue) : undefined;

          if (previousNodeValue !== undefined && previousNodeValue === currentPayload) break;

          // Check for missing payload value.
          // Explicitly check for "undefined" as we should
          // persist other falsy value (see: "writeFalsyValues" test).
          if (currentPayload === undefined) {
            // The currentPayload doesn't have the value.
            // Look into containerNode (which can be previous snapshot)
            // for possible reuse value. We explicitly check for undefined
            // as it indicates that the value doesn't exist.
            currentPayload = previousNodeValue !== undefined
              ? previousNodeValue : null;
          }

          // This field is a leaf field and does not contain any nested
          // selection sets just reference payload value in the graph snapshot
          // node.
          if (currentPayload === null || !selection.selectionSet) {
            // Fix references. See: orphan node tests on "orphan a subgraph"
            // The new value is null and the old value is an entity. We will
            // want to remove reference to such entity
            if (previousNodeId) {
              referenceEdits.push({
                containerId: currentContainerId,
                path: currentPath,
                prevNodeId: previousNodeId,
                nextNodeId: undefined,
              });
            }

            // Note that we can perform a _deep_ equality check here, in cases
            // where a leaf node is a complex object.
            if (!lodashIsEqual(currentPayload, previousNodeValue)) {
              // We intentionally do not deep copy the nodeValue as Apollo will
              // then perform Object.freeze anyway. So any change in the payload
              // value afterward will be reflect in the graph as well.
              //
              // We use selection.name.value instead of payloadKey so that we
              // always write to cache using real field name rather than alias
              // name.
              this._setValue(currentContainerId, currentPath, currentPayload);
            }

          // This field contains other fields; so we are not concerned with its
          // direct values, and instead walk into it.
          } else if (selection.selectionSet) {
            if (isScalar(currentPayload)) {
              const path = `${[...prevPath, payloadKey].join('.')}`;
              throw new Error(`Received a scalar value for a field that should be a complex object at ${path}`);
            }

            // It is still possible to be a DynamicField in the case of alias
            const childDynamicMap = currentDynamicFieldMap instanceof DynamicField
              ? currentDynamicFieldMap.children : currentDynamicFieldMap;

            // TODO(yuisu): consider checking the consistency of the array.
            // E.g all elements are entities, or none are.
            if (Array.isArray(currentPayload)) {
              const payloadLength = currentPayload.length;
              // TODO(ianm): should we throw an error if there was a previous
              // value that is not an array? Or is that a valid type transition?
              const previousLength = Array.isArray(previousNodeValue) ? previousNodeValue.length : -1;

              // Note that even though we walk into arrays, we need to be
              // careful to ensure that we don't leave stray values around if
              // the new array is of a different length.
              //
              // So, we resize the array to our desired size before walking.
              if (payloadLength !== previousLength) {
                const newArray = Array.isArray(previousNodeValue)
                  ? previousNodeValue.slice(0, payloadLength) : new Array(payloadLength);
                this._setValue(currentContainerId, currentPath, newArray);
              }

              // TODO(ianm): Much of this logic overlaps with above.  Needs to
              // be shared!
              for (let idx = 0; idx < payloadLength; ++idx) {
                const element = currentPayload[idx];
                const elementPath = [...currentPath, idx];
                const nextNodeId = this._context.entityIdForValue(element);
                const previousNodeAtIdx = get(previousNodeValue, idx);
                const previousChildNodeId = isObject(previousNodeAtIdx)
                  ? this._context.entityIdForValue(previousNodeAtIdx) : undefined;

                // If an element in an array is `null`, `undefined`, or is
                // missing (sparse array) we write it as `null`. Otherwise
                // recurse so we can merge with any pre-existing values.
                //
                // For example see: "treats blanks in sparse arrays as null" and
                // "returns the selected values, overlaid on the underlying
                // data"
                if (isNil(element)) {
                  this._setValue(currentContainerId, elementPath, null);
                } else if (nextNodeId) {
                  this._walkSelectionSets(
                    selection.selectionSet,
                    element,
                    [],
                    childDynamicMap,
                    nextNodeId,
                    fragmentsMap,
                    referenceEdits
                  );
                } else {
                  this._walkSelectionSets(
                    selection.selectionSet,
                    element,
                    elementPath,
                    childDynamicMap,
                    currentContainerId,
                    fragmentsMap,
                    referenceEdits
                  );
                }

                // The reference between old and new one change, so update the
                // reference
                if (previousChildNodeId !== nextNodeId) {
                  referenceEdits.push({
                    containerId: currentContainerId,
                    path: elementPath,
                    prevNodeId: previousChildNodeId,
                    nextNodeId,
                  });
                }
              }
              break;
            }

            const entityIdOfCurrentPayload = this._context.entityIdForValue(currentPayload);
            let nextNodeId = entityIdOfCurrentPayload;

            if (nextNodeId || previousNodeId) {
            // TODO(yuisu): Throw an error when there was previously an entity
            // but the new payload value is not one; as well as when there is
            // a previous value and the new value is an entity.
              if (!nextNodeId && prevPayload) {
                nextNodeId = previousNodeId;
              }

              if (previousNodeId !== nextNodeId) {
                referenceEdits.push({
                  containerId: currentContainerId,
                  path: currentPath,
                  prevNodeId: previousNodeId,
                  nextNodeId,
                });
              }
            }

            // CurrentPayload is considered as an entity.
            if (entityIdOfCurrentPayload !== undefined) {
              this._walkSelectionSets(
                selection.selectionSet,
                currentPayload,
                /* prevPath */ [],
                childDynamicMap,
                  nextNodeId!,
                  fragmentsMap,
                  referenceEdits
              );
            } else {
              // CurrentPayload is not an entity so we didn't reset the path
              this._walkSelectionSets(
                selection.selectionSet,
                currentPayload,
                currentPath,
                childDynamicMap,
                currentContainerId,
                fragmentsMap,
                referenceEdits
              );
            }
          }
          break;
        }
        case 'FragmentSpread': {
          const fragmentNode = fragmentsMap[selection.name.value];
          this._walkSelectionSets(
            fragmentNode.selectionSet,
            prevPayload,
            prevPath,
            prevDynamicFieldMap,
            currentContainerId,
            fragmentsMap,
            referenceEdits
          );
          break;
        }
        default: {
          this._context.warn(`${selection.kind} selection set nodes are not supported`);
          break;
        }
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
      const target = nextNodeId ? this.getNodeData(nextNodeId) : null;
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

    const snapshot = new GraphSnapshot(snapshots);
    if (this._context.freezeSnapshots) {
      deepFreeze(snapshot);
    }

    return {
      snapshot,
      editedNodeIds: this._editedNodeIds,
      writtenQueries: this._writtenQueries,
    };
  }

  /**
   * Retrieve the _latest_ version of a node.
   */
  private getNodeData(id: NodeId) {
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
   * Ensures that there is a ParameterizedValueSnapshot for the given node with
   * arguments
   */
  _ensureParameterizedValueSnapshot(containerId: NodeId, path: PathPart[], args: FieldArguments) {
    const fieldId = nodeIdForParameterizedValue(containerId, path, args);

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

  /**
   * Ensures that there is a ParameterizedValueSnapshot for the given field.
   */
  _deprecatedEnsureParameterizedValueSnapshot(containerId: NodeId, path: PathPart[], field: DynamicFieldWithArgs) {
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
