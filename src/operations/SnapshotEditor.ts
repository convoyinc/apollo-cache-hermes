import { isEqual } from 'apollo-utilities';

import { CacheContext } from '../context';
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
  hasNodeReference,
  isNil,
  lazyImmutableDeepSet,
  pathBeginsWith,
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
  /** Whether we know we can skip the write. */
  noWrite?: true;
}

// https://github.com/nzakas/eslint-plugin-typescript/issues/69
type NodeSnapshotMap = { [Key in NodeId]?: NodeSnapshot };

type VisitedSubgraphsMap = { [Key in NodeId]: Set<ParsedQuery> };

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
  private _newNodes: NodeSnapshotMap = Object.create(null);

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
  mergePayload(query: RawOperation, payload: JsonObject): { warnings?: string[] } {
    const parsed = this._context.parseOperation(query);

    // We collect all warnings associated with this operation to avoid
    // overwhelming the log for particularly nasty payloads.
    const warnings: string[] = [];

    // First, we walk the payload and apply all _scalar_ edits, while collecting
    // all references that have changed.  Reference changes are applied later,
    // once all new nodes have been built (and we can guarantee that we're
    // referencing the correct version).
    const referenceEdits: ReferenceEdit[] = [];
    this._mergeSubgraph(
      {} /* visitedSubgraphs */,
      referenceEdits,
      warnings,
      parsed.rootId,
      [] /* prefixPath */,
      [] /* path */,
      parsed.parsedQuery,
      payload,
    );

    // Now that we have new versions of every edited node, we can point all the
    // edited references to the correct nodes.
    //
    // In addition, this performs bookkeeping the inboundReferences of affected
    // nodes, and collects all newly orphaned nodes.
    const orphanedNodeIds = this._mergeReferenceEdits(referenceEdits);

    // Remove (garbage collect) orphaned subgraphs.
    this._removeOrphanedNodes(orphanedNodeIds);

    // The query should now be considered complete for future reads.
    this._writtenQueries.add(parsed);

    // Don't emit empty arrays for easy testing upstream.
    return warnings.length ? { warnings } : {};
  }

  /**
   * Merge a payload (subgraph) into the cache, following the parsed form of the
   * operation.
   */
  private _mergeSubgraph(
    visitedSubgraphs: VisitedSubgraphsMap,
    referenceEdits: ReferenceEdit[],
    warnings: string[],
    containerId: NodeId,
    prefixPath: PathPart[],
    path: PathPart[],
    parsed: ParsedQuery,
    payload: JsonValue | undefined,
  ) {
    // Don't trust our inputs; we can receive values that aren't JSON
    // serializable via optimistic updates.
    if (payload === undefined) {
      payload = null;
    }

    // We should only ever reach a subgraph if it is a container (object/array).
    if (typeof payload !== 'object') {
      const message = `Received a ${typeof payload} value, but expected an object/array/null`;
      throw new InvalidPayloadError(message, prefixPath, containerId, path, payload);
    }

    // TODO(ianm): We're doing this a lot.  How much is it impacting perf?
    const previousValue = deepGet(this._getNodeData(containerId), path);

    // Recurse into arrays.
    if (Array.isArray(payload) || Array.isArray(previousValue)) {
      if (!isNil(previousValue) && !Array.isArray(previousValue)) {
        throw new InvalidPayloadError(`Unsupported transition from a non-list to list value`, prefixPath, containerId, path, payload);
      }
      if (!isNil(payload) && !Array.isArray(payload)) {
        throw new InvalidPayloadError(`Unsupported transition from a list to a non-list value`, prefixPath, containerId, path, payload);
      }

      this._mergeArraySubgraph(visitedSubgraphs, referenceEdits, warnings, containerId, prefixPath, path, parsed, payload, previousValue);
      return;
    }

    const payloadId = this._context.entityIdForValue(payload);
    const previousId = this._context.entityIdForValue(previousValue);

    // TODO(jamesreggio): Does `excluded` need to evaluated before this?

    // Is this an identity change?
    if (payloadId !== previousId) {
      // It is invalid to transition from a *value* with an id to one without.
      if (!isNil(payload) && !payloadId) {
        const message = `Unsupported transition from an entity to a non-entity value`;
        throw new InvalidPayloadError(message, prefixPath, containerId, path, payload);
      }
      // The reverse is also invalid.
      if (!isNil(previousValue) && !previousId) {
        const message = `Unsupported transition from a non-entity value to an entity`;
        throw new InvalidPayloadError(message, prefixPath, containerId, path, payload);
      }
      // Double check that our id generator is behaving properly.
      if (payloadId && isNil(payload)) {
        throw new OperationError(`entityIdForNode emitted an id for a nil payload value`, prefixPath, containerId, path, payload);
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
    } else if (isNil(payload)) {
      if (previousValue !== null) {
        this._setValue(containerId, path, null, true);
      }
      return;
    }

    // Return early if we've already written payloadId with the given query.
    if (payloadId) {
      if (!visitedSubgraphs[payloadId]) {
        visitedSubgraphs[payloadId] = new Set<ParsedQuery>();
      }

      if (visitedSubgraphs[payloadId].has(parsed)) {
        return;
      }

      visitedSubgraphs[payloadId].add(parsed);
    }

    // If we've entered a new node; it becomes our container.
    if (payloadId) {
      prefixPath = [...prefixPath, ...path];
      containerId = payloadId;
      path = [];
    }

    // Finally, we can walk into individual values.
    for (const payloadName in parsed) {
      const node = parsed[payloadName];

      if (node.excluded) {
        continue;
      }

      // Having a schemaName on the node implies that payloadName is an alias.
      const schemaName = node.schemaName ? node.schemaName : payloadName;
      let fieldValue = deepGet(payload, [payloadName]) as JsonValue | undefined;
      // Don't trust our inputs.  Ensure that missing values are null.
      if (fieldValue === undefined) {
        fieldValue = null;

        // And if it was explicitly undefined, that likely indicates a malformed
        // input (mutation, direct write).
        if (payload && payloadName in payload) {
          warnings.push(`Encountered undefined at ${[...prefixPath, ...path].join('.')}. Treating as null`);
        }
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
      //     data: { id: 1, name: 'Foo' },
      //   },
      //   'ROOT_QUERY❖["foo"]❖{"id":1}': {
      //     data: // a direct reference to the node of entity '1'.
      //   },
      //
      // This allows us to rely on standard behavior for entity references: If
      // node '1' is edited, the parameterized node must also be edited.
      // Similarly, the parameterized node contains an outbound reference to the
      // entity node, for garbage collection.
      let fieldPrefixPath = prefixPath;
      let fieldPath = [...path, schemaName];
      if (node.args) {
        // The values of a parameterized field are explicit nodes in the graph;
        // so we set up a new container & path.
        containerIdForField = this._ensureParameterizedValueSnapshot(containerId, fieldPath, node.args);
        fieldPrefixPath = [...prefixPath, ...fieldPath];
        fieldPath = [];
      }

      // Note that we're careful to fetch the value of our new container; not
      // the outer container.
      const previousFieldValue = deepGet(this._getNodeData(containerIdForField), fieldPath);

      // For fields with sub selections, we walk into them; only leaf fields are
      // directly written via _setValue.  This allows us to perform minimal
      // edits to the graph.
      if (node.children) {
        this._mergeSubgraph(
          visitedSubgraphs,
          referenceEdits,
          warnings,
          containerIdForField,
          fieldPrefixPath,
          fieldPath,
          node.children,
          fieldValue,
        );

      // We've hit a leaf field.
      //
      // Note that we must perform a _deep_ equality check here, to cover cases
      // where a leaf value is a complex object.
      } else if (!isEqual(fieldValue, previousFieldValue)) {
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

  /**
   * Merge an array from the payload (or previous cache data).
   */
  private _mergeArraySubgraph(
    visitedSubgraphs: VisitedSubgraphsMap,
    referenceEdits: ReferenceEdit[],
    warnings: string[],
    containerId: NodeId,
    prefixPath: PathPart[],
    path: PathPart[],
    parsed: ParsedQuery,
    payload: JsonArray | nil,
    previousValue: JsonArray | nil,
  ) {
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

      // Drop any extraneous references.
      if (payloadLength < previousLength) {
        this._removeArrayReferences(referenceEdits, containerId, path, payloadLength - 1);
      }
    }

    // Note that we're careful to iterate over all indexes, in case this is a
    // sparse array.
    for (let i = 0; i < payload.length; i++) {
      let childPayload = payload[i];
      if (childPayload === undefined) {
        // Undefined values in an array are strictly invalid; and likely
        // indicate a malformed input (mutation, direct write).
        childPayload = null;

        if (i in payload) {
          warnings.push(`Encountered undefined at ${[...path, i].join('.')}. Treating as null`);
        } else {
          warnings.push(`Encountered hole in array at ${[...path, i].join('.')}. Filling with null`);
        }
      }

      this._mergeSubgraph(visitedSubgraphs, referenceEdits, warnings, containerId, prefixPath, [...path, i], parsed, childPayload);
    }
  }

  /**
   *
   */
  private _removeArrayReferences(referenceEdits: ReferenceEdit[], containerId: NodeId, prefix: PathPart[], afterIndex: number) {
    const container = this._getNodeSnapshot(containerId);
    if (!container || !container.outbound) return;
    for (const reference of container.outbound) {
      if (!pathBeginsWith(reference.path, prefix)) continue;
      const index = reference.path[prefix.length];
      if (typeof index !== 'number') continue;
      if (index <= afterIndex) continue;

      // At this point, we've got a reference beyond the array's new bounds.
      referenceEdits.push({
        containerId,
        path: reference.path,
        prevNodeId: reference.id,
        nextNodeId: undefined,
        noWrite: true,
      });
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

    for (const { containerId, path, prevNodeId, nextNodeId, noWrite } of referenceEdits) {
      if (!noWrite) {
        const target = nextNodeId ? this._getNodeData(nextNodeId) : null;
        this._setValue(containerId, path, target);
      }
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
   * Commits the transaction, returning a new immutable snapshot.
   */
  commit(): EditedSnapshot {
    // At this point, every node that has had any of its properties change now
    // exists in _newNodes.  In order to preserve immutability, we need to walk
    // all nodes that transitively reference an edited node, and update their
    // references to point to the new version.
    this._rebuildInboundReferences();

    const snapshot = this._buildNewSnapshot();
    if (this._context.freezeSnapshots) {
      snapshot.freeze();
    }

    return {
      snapshot,
      editedNodeIds: this._editedNodeIds,
      writtenQueries: this._writtenQueries,
    };
  }

  /**
   * Collect all our pending changes into a new GraphSnapshot.
   */
  _buildNewSnapshot() {
    const { entityTransformer } = this._context;
    const snapshots = { ...this._parent._values };

    for (const id in this._newNodes) {
      const newSnapshot = this._newNodes[id];
      // Drop snapshots that were garbage collected.
      if (newSnapshot === undefined) {
        delete snapshots[id];
      } else {
        // TODO: This should not be run for ParameterizedValueSnapshots
        if (entityTransformer) {
          const { data } = this._newNodes[id] as EntitySnapshot;
          if (data) entityTransformer(data);
        }
        snapshots[id] = newSnapshot;
      }
    }

    return new GraphSnapshot(snapshots);
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
      const snapshot = this._getNodeSnapshot(nodeId);
      if (!(snapshot instanceof EntitySnapshot)) continue;
      if (!snapshot || !snapshot.inbound) continue;

      for (const { id, path } of snapshot.inbound) {
        this._setValue(id, path, snapshot.data, false);
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
      const node = this._getNodeSnapshot(nodeId);
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
   * Retrieve the _latest_ version of a node snapshot.
   */
  private _getNodeSnapshot(id: NodeId) {
    return id in this._newNodes ? this._newNodes[id] : this._parent.getNodeSnapshot(id);
  }

  /**
   * Retrieve the _latest_ version of a node.
   */
  private _getNodeData(id: NodeId) {
    const snapshot = this._getNodeSnapshot(id);
    return snapshot ? snapshot.data : undefined;
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
    current.data = lazyImmutableDeepSet(current.data, parent && parent.data, path, newValue);
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
  private _ensureParameterizedValueSnapshot(containerId: NodeId, path: PathPart[], args: FieldArguments) {
    const fieldId = nodeIdForParameterizedValue(containerId, path, args);

    // We're careful to not edit the container unless we absolutely have to.
    // (There may be no changes for this parameterized value).
    const containerSnapshot = this._getNodeSnapshot(containerId);
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
