import isEqual from '@wry/equality';
import { FieldFunctionOptions, FieldPolicy, FieldReadFunction, TypePolicy } from '@apollo/client/cache/inmemory/policies';
import { isReference, makeReference, Reference, StoreValue } from '@apollo/client';
import { ReadFieldOptions } from '@apollo/client/cache/core/types/common';
import { StoreObject } from '@apollo/client/utilities';

import { CacheContext } from '../context';
import { InvalidPayloadError, OperationError } from '../errors';
import { GraphSnapshot } from '../GraphSnapshot';
import { cloneNodeSnapshot, EntitySnapshot, NodeSnapshot, ParameterizedValueSnapshot } from '../nodes';
import { FieldArguments, ParsedQuery } from '../ParsedQueryNode';
import { JsonArray, JsonObject, JsonValue, Nil, PathPart } from '../primitive';
import { NodeId, OperationInstance, RawOperation, StaticNodeId } from '../schema';
import {
  addNodeReference,
  addToSet,
  deepGet,
  hasNodeReference,
  hasOwn,
  isNil,
  lazyImmutableDeepSet,
  pathBeginsWith,
  removeNodeReference,
} from '../util';

const ensureIdConstistencyMsg = `Ensure id is included (or not included) consistently across multiple requests.`;
/**
 * A newly modified snapshot.
 */
export interface EditedSnapshot<TSerialized = GraphSnapshot> {
  snapshot: GraphSnapshot;
  editedNodeIds: Set<NodeId>;
  writtenQueries: Set<OperationInstance<TSerialized>>;
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
export type NodeSnapshotMap = { [Key in NodeId]?: NodeSnapshot };

/**
 * Builds a set of changes to apply on top of an existing `GraphSnapshot`.
 *
 * Performs the minimal set of edits to generate new immutable versions of each
 * node, while preserving immutability of the parent snapshot.
 */
export class SnapshotEditor<TSerialized> {

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
  private _writtenQueries = new Set<OperationInstance<TSerialized>>();
  private _pathToId = Object.create(null);

  constructor(
    /** The configuration/context to use when editing snapshots. */
    private _context: CacheContext<TSerialized>,
    /** The snapshot to base edits off of. */
    private _parent: GraphSnapshot,
  ) {}

  /**
   * Merge a GraphQL payload (query/fragment/etc) into the snapshot, rooted at
   * the node identified by `rootId`.
   */
  mergePayload(query: RawOperation, payload: JsonObject, prune: boolean): { warnings?: string[] } {
    const parsed = this._context.parseOperation(query);

    // We collect all warnings associated with this operation to avoid
    // overwhelming the log for particularly nasty payloads.
    const warnings: string[] = [];

    // First, we walk the payload and apply all _scalar_ edits, while collecting
    // all references that have changed.  Reference changes are applied later,
    // once all new nodes have been built (and we can guarantee that we're
    // referencing the correct version).
    const referenceEdits: ReferenceEdit[] = [];
    this._mergeSubgraph(referenceEdits, warnings, parsed.rootId, [] /* prefixPath */, [] /* path */, parsed.parsedQuery, payload, prune);

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
    referenceEdits: ReferenceEdit[],
    warnings: string[],
    containerId: NodeId,
    prefixPath: PathPart[],
    path: PathPart[],
    parsed: ParsedQuery,
    payload: JsonValue | undefined,
    prune: boolean,
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
    const previousValue = this._getPreviousValue(containerId, path);

    const isRoot = containerId === StaticNodeId.QueryRoot;
    const typename = isRoot ? 'Query'
      : payload && typeof payload === 'object' && '__typename' in payload
        ? payload.__typename
        : (previousValue && typeof previousValue === 'object' && '__typename' in previousValue
          ? previousValue.__typename
          : undefined);

    const typePolicy: TypePolicy | undefined
      = typeof typename === 'string' ? this._context.typePolicies?.[typename] : undefined;
    if (typeof typePolicy?.merge === 'function') {
      payload = typePolicy.merge(previousValue, payload, {} as any) as JsonObject;
    }

    // Recurse into arrays.
    if (Array.isArray(payload) || Array.isArray(previousValue)) {
      if (!isNil(previousValue) && !Array.isArray(previousValue)) {
        throw new InvalidPayloadError(`Unsupported transition from a non-list to list value`, prefixPath, containerId, path, payload);
      }
      if (!isNil(payload) && !Array.isArray(payload)) {
        throw new InvalidPayloadError(`Unsupported transition from a list to a non-list value`, prefixPath, containerId, path, payload);
      }

      this._mergeArraySubgraph(referenceEdits, warnings, containerId, prefixPath, path, parsed, payload, previousValue, prune);
      return;
    }

    const visiblePayload = {};
    const visiblePrevious = {};
    if (payload) {
      for (const key in parsed) {
        const value = payload[key];
        const previous = previousValue?.[key];

        visiblePayload[key] = value;
        visiblePrevious[key] = previous;

        const schemaName = parsed[key].schemaName;
        if (schemaName) {
          visiblePayload[schemaName] = value;
          visiblePrevious[schemaName] = previous;
        }
      }
    }

    const ref = isReference(payload) ? payload.__ref : undefined;
    const payloadId = ref
      ?? this._context.entityIdForValue(visiblePayload)
      ?? this._context.entityIdForValue(payload)
      ?? (path.length === 0 && !isRoot ? containerId : undefined);
    const previousId = this._context.entityIdForValue(visiblePrevious)
      ?? this._context.entityIdForValue(previousValue)
      ?? (path.length === 0 && !isRoot ? containerId : deepGet(this._pathToId[containerId], path));

    // Is this an identity change?
    if (payloadId !== previousId) {
      // It is invalid to transition from a *value* with an id to one without.
      if (!isNil(payload) && !payloadId) {
        const message = `Unsupported transition from an entity to a non-entity value. ${ensureIdConstistencyMsg}`;
        throw new InvalidPayloadError(message, prefixPath, containerId, path, payload);
      }
      // The reverse is also invalid.
      if (!isNil(previousValue) && !previousId) {
        const message = `Unsupported transition from a non-entity value to an entity. ${ensureIdConstistencyMsg}`;
        throw new InvalidPayloadError(message, prefixPath, containerId, path, payload);
      }
      // Double check that our id generator is behaving properly.
      if (payloadId && isNil(payload)) {
        throw new OperationError(`entityIdForNode emitted an id for a nil payload value`, prefixPath, containerId, path, payload);
      }

      // Fix references. See: orphan node tests on "orphan a subgraph" The new
      // value is null and the old value is an entity. We will want to remove
      // reference to such entity
      if (containerId !== payloadId || path.length !== 0) {
        if (!(containerId in this._pathToId)) {
          this._pathToId[containerId] = Object.create(null);
        }
        lazyImmutableDeepSet(this._pathToId[containerId], undefined, path, payloadId);
        referenceEdits.push({
          containerId,
          path,
          prevNodeId: previousId,
          nextNodeId: payloadId,
        });
      }

      // Nothing more to do here; the reference edit will null out this field.
      if (!payloadId) return;
      // Enough to set the reference, no sub selections to traverse in the ref
      if (ref) return;

    // End of the line for a non-reference.
    } else if (isNil(payload)) {
      if (previousValue !== null) {
        this._setValue(containerId, path, null);
      }
      return;
    }

    // If we've entered a new node; it becomes our container.
    if (payloadId) {
      prefixPath = [...prefixPath, ...path];
      containerId = payloadId;
      path = [];
    }

    const readFromSnapshot = (obj: Readonly<NodeSnapshot>, key: string) => {
      const data = obj.data;
      if (!data || typeof data !== 'object') {
        return undefined;
      }
      if (key in data) {
        return data[key];
      }
      for (const out of obj.outbound ?? []) {
        if (out.path[0] === key) {
          return this._getNodeData(out.id);
        }
      }
      if (containerId === 'ROOT_QUERY' && key === '__typename') {
        return 'Query';
      }
      return undefined;
    };

    const readField = (
      fieldNameOrOptions: string | ReadFieldOptions,
      from: StoreObject | Reference = { __ref: containerId } as StoreObject
    ) => {
      if (!from) {
        return undefined;
      }
      if (typeof fieldNameOrOptions !== 'string') throw new Error('Not implemented');

      if (isReference(from)) {
        const obj = this._getNodeSnapshot(from.__ref);
        if (!obj) {
          return undefined;
        }
        return readFromSnapshot(obj, fieldNameOrOptions);
      } else {
        return from[fieldNameOrOptions];
      }
    };

    const mergeOptions: FieldFunctionOptions = {
      args: null,
      cache: null as any,
      canRead: (value: StoreValue): boolean => {
        return isReference(value)
          ? this._getNodeSnapshot(value.__ref) != null
          : typeof value === 'object' && value !== null;
      },
      field: null,
      fieldName: '',
      isReference,
      readField,
      storage: this._newNodes,
      storeFieldName: '',
      toReference: (value, mergeIntoStore) => {
        const entityId = this._context.entityIdForValue(value);
        if (entityId && mergeIntoStore && !isReference(value) && typeof value !== 'string') {
          this._ensureNewSnapshot(entityId).data = value as JsonValue;
        }
        return entityId ? makeReference(entityId) : undefined;
      },
      variables: undefined,
      mergeObjects<T>(existing: T, incoming: T): T {
        return incoming && { ...existing, ...incoming };
      },
    };

    // Finally, we can walk into individual values.
    for (const payloadName in parsed) {
      const node = parsed[payloadName];
      // Having a schemaName on the node implies that payloadName is an alias.
      const schemaName = node.schemaName ? node.schemaName : payloadName;
      let fieldValue = deepGet(payload, [payloadName]) as JsonValue | undefined;
      // Don't trust our inputs.
      if (fieldValue === undefined) {
        // If it was explicitly undefined, that likely indicates a malformed
        // input (mutation, direct write).
        if (payload && payloadName in payload) {
          warnings.push(`Encountered undefined at ${[...prefixPath, ...path].join('.')}. Treating as null`);
        }

        continue;
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
        if (fieldValue === null && prune) {
          this._setValue(containerIdForField, path, null);
          continue;
        }
        // The values of a parameterized field are explicit nodes in the graph;
        // so we set up a new container & path.
        containerIdForField = this._ensureParameterizedValueSnapshot(containerId, fieldPath, node.args);
        fieldPrefixPath = [...prefixPath, ...fieldPath];
        fieldPath = [];
      }

      // Note that we're careful to fetch the value of our new container; not
      // the outer container.
      const previousFieldValue = this._getPreviousValue(containerIdForField, fieldPath);
      const fieldPolicy: FieldPolicy<any> | FieldReadFunction<any> | undefined = typePolicy ? typePolicy.fields?.[payloadName] : undefined;
      const merge = typeof fieldPolicy === 'object' && typeof fieldPolicy?.merge === 'function' ? fieldPolicy?.merge : undefined;
      if (merge) {
        mergeOptions.args = node.args ?? null;
        mergeOptions.fieldName = payloadName;
        mergeOptions.storeFieldName = payloadName;
        fieldValue = merge(previousFieldValue, fieldValue, mergeOptions) as JsonValue;
      }

      // For fields with sub selections, we walk into them; only leaf fields are
      // directly written via _setValue.  This allows us to perform minimal
      // edits to the graph.
      if (node.children) {
        this._mergeSubgraph(referenceEdits, warnings, containerIdForField, fieldPrefixPath, fieldPath, node.children, fieldValue, prune);

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
    if (payload && !prune) {
      for (const payloadName of Object.keys(payload)) {
        if (!hasOwn.call(parsed, payloadName)) {
          const value = payload[payloadName];
          const fieldPath = [...path, payloadName];
          this._setValue(containerId, fieldPath, value);
        }
      }
    }
  }

  /**
   * Merge an array from the payload (or previous cache data).
   */
  private _mergeArraySubgraph(
    referenceEdits: ReferenceEdit[],
    warnings: string[],
    containerId: NodeId,
    prefixPath: PathPart[],
    path: PathPart[],
    parsed: ParsedQuery,
    payload: JsonArray | Nil,
    previousValue: JsonArray | Nil,
    prune: boolean,
  ) {
    if (isNil(payload)) {
      // Note that we mark this as an edit, as this method is only ever called
      // if we've determined the value to be an array (which means that
      // previousValue MUST be an array in this case).
      this._setValue(containerId, path, null);
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

      this._mergeSubgraph(referenceEdits, warnings, containerId, prefixPath, [...path, i], parsed, childPayload, prune);
    }
  }

  delete(nodeId: NodeId) {
    this._editedNodeIds.add(nodeId);
    const referenceEdits: ReferenceEdit[] = [];
    const nodeSnapshot = this._parent.getNodeSnapshot(nodeId);

    nodeSnapshot?.inbound?.forEach(({ id, path }) => {
      this._editedNodeIds.add(id);
      referenceEdits.push({ containerId: id, nextNodeId: undefined, prevNodeId: nodeId, path });
    });

    nodeSnapshot?.outbound?.forEach(({ id, path }) => {
      this._editedNodeIds.add(id);
      referenceEdits.push({ containerId: nodeId, nextNodeId: undefined, prevNodeId: id, path });
    });

    this._mergeReferenceEdits(referenceEdits);
    this._newNodes[nodeId] = undefined;
  }

  /**
   * Modify a GraphQL payload (query/fragment/etc) into the snapshot, rooted at
   * the node identified by `rootId`.
   */
  modify(rootId: NodeId, payload: JsonObject, deleted: Set<string>): { warnings?: string[] } {
    const warnings: string[] = [];
    const referenceEdits: ReferenceEdit[] = [];
    this._modifySubgraph(referenceEdits, warnings, rootId, [] /* prefixPath */, [] /* path */, payload, deleted);
    this._mergeReferenceEdits(referenceEdits);
    return warnings.length ? { warnings } : {};
  }

  /**
   * Modify a payload (subgraph) into the cache.
   */
  private _modifySubgraph(
    referenceEdits: ReferenceEdit[],
    warnings: string[],
    containerId: NodeId,
    prefixPath: PathPart[],
    path: PathPart[],
    payload: JsonValue | undefined,
    deleted: Set<string>,
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
    const previousValue = this._getPreviousValue(containerId, path);
    const nodeSnapshot = this._getNodeSnapshot(containerId);

    // Recurse into arrays.
    if (Array.isArray(payload) || Array.isArray(previousValue)) {
      if (!isNil(previousValue) && !Array.isArray(previousValue)) {
        throw new InvalidPayloadError(`Unsupported transition from a non-list to list value`, prefixPath, containerId, path, payload);
      }
      if (!isNil(payload) && !Array.isArray(payload)) {
        throw new InvalidPayloadError(`Unsupported transition from a list to a non-list value`, prefixPath, containerId, path, payload);
      }

      this._modifyArraySubgraph(referenceEdits, warnings, containerId, prefixPath, path, payload, previousValue);
      return;
    }

    const reference = isReference(payload) ? payload.__ref : null;
    const payloadId = reference ? reference : this._context.entityIdForValue({ ...previousValue as JsonObject, ...payload });
    const previousId = this._context.entityIdForValue(previousValue);

    // Is this an identity change?
    if (payloadId !== previousId) {
      // It is invalid to transition from a *value* with an id to one without.
      if (!isNil(payload) && !payloadId) {
        const message = `Unsupported transition from an entity to a non-entity value. ${ensureIdConstistencyMsg}`;
        throw new InvalidPayloadError(message, prefixPath, containerId, path, payload);
      }
      // The reverse is also invalid.
      if (!isNil(previousValue) && !previousId) {
        const message = `Unsupported transition from a non-entity value to an entity. ${ensureIdConstistencyMsg}`;
        throw new InvalidPayloadError(message, prefixPath, containerId, path, payload);
      }
      // Double check that our id generator is behaving properly.
      if (payloadId && isNil(payload)) {
        throw new OperationError(`entityIdForNode emitted an id for a nil payload value`, prefixPath, containerId, path, payload);
      }

      // Fix references. See: orphan node tests on "orphan a subgraph" The new
      // value is null and the old value is an entity. We will want to remove
      // reference to such entity
      if (containerId !== payloadId || path.length !== 0) {
        referenceEdits.push({
          containerId,
          path,
          prevNodeId: previousId,
          nextNodeId: payloadId,
        });
      }

      // Nothing more to do here; the reference edit will null out this field.
      if (!payloadId || reference) return;

    // End of the line for a non-reference.
    } else if (isNil(payload)) {
      if (previousValue !== null) {
        this._setValue(containerId, path, null);
      }
      return;
    }

    // If we've entered a new node; it becomes our container.
    if (payloadId) {
      prefixPath = [...prefixPath, ...path];
      containerId = payloadId;
      path = [];
    }

    // Finally, we can walk into individual values.
    for (const payloadName in payload) {
      const node = payload[payloadName];
      // Having a schemaName on the node implies that payloadName is an alias.
      const fieldValue = deepGet(payload, [payloadName]) as JsonValue | undefined;

      // Don't trust our inputs.
      if (fieldValue === undefined) {
        // If it was explicitly undefined, that likely indicates a malformed
        // input (mutation, direct write).
        if (payload && payloadName in payload) {
          warnings.push(`Encountered undefined at ${[...prefixPath, ...path].join('.')}. Treating as null`);
        }

        continue;
      }

      const containerIdForField = containerId;

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
      const fieldPrefixPath = prefixPath;
      const fieldPath = [...path, payloadName];

      const parameterizedFields = nodeSnapshot?.outbound?.filter(ref => ref.path[0] === payloadName);
      if (parameterizedFields?.length) {
        for (const field of parameterizedFields) {
          // The values of a parameterized field are explicit nodes in the graph
          // so we set up a new container & path.
          this._modifySubgraph(
            referenceEdits,
            warnings,
            field.id,
            [...prefixPath, ...field.path],
            [],
            deepGet(fieldValue, field.path.slice(1)),
            new Set(),
          );
        }
        if (parameterizedFields.some(field => field.path.length === 1)) {
          return;
        }
      }

      // Note that we're careful to fetch the value of our new container; not
      // the outer container.
      const previousFieldValue = this._getPreviousValue(containerIdForField, fieldPath);

      // For fields with sub selections, we walk into them; only leaf fields are
      // directly written via _setValue.  This allows us to perform minimal
      // edits to the graph.
      if (typeof node === 'object') {
        this._modifySubgraph(referenceEdits, warnings, containerIdForField, fieldPrefixPath, fieldPath, fieldValue, new Set());

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
    const node = this._getNodeSnapshot(containerId);
    const value = deepGet(node?.data, path);

    for (const key of deleted) {
      const fieldPath = [...path, key];
      if (value && key in value) {
        this._setValue(containerId, fieldPath, undefined, true, true);
      } else {
        const keyParts = key.split('❖');
        const keyPath = keyParts.length > 1 ? JSON.parse(keyParts[1]) : [key];
        referenceEdits.push({
          containerId,
          path: keyPath,
          prevNodeId: key,
          nextNodeId: undefined,
        });
      }
    }
  }

  private _getPreviousValue(containerId: string, path: PathPart[]): JsonValue | undefined {
    const node = this._getNodeSnapshot(containerId);
    const value = deepGet(node?.data, path);
    if (value === undefined) {
      if (node) {
        const pathLength = path.length;
        for (const out of node.outbound ?? []) {
          if (out.path.length !== pathLength) continue;
          if (path.some((part, i) => part !== out.path[i])) continue;
          return this._getNodeData(out.id);
        }
      }
    }
    return value;
  }

  /**
   * Modify an array from the payload (or previous cache data).
   */
  private _modifyArraySubgraph(
    referenceEdits: ReferenceEdit[],
    warnings: string[],
    containerId: NodeId,
    prefixPath: PathPart[],
    path: PathPart[],
    payload: JsonArray | Nil,
    previousValue: JsonArray | Nil,
  ) {
    if (isNil(payload)) {
      // Note that we mark this as an edit, as this method is only ever called
      // if we've determined the value to be an array (which means that
      // previousValue MUST be an array in this case).
      this._setValue(containerId, path, null);
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

      if (typeof childPayload === 'object') {
        this._modifySubgraph(referenceEdits, warnings, containerId, prefixPath, [...path, i], childPayload, new Set());
      } else {
        this._setValue(containerId, [...path, i], childPayload);
      }
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

    for (const id of orphanedNodeIds) {
      this._editedNodeIds.add(id);
    }

    return orphanedNodeIds;
  }

  /**
   * Commits the transaction, returning a new immutable snapshot.
   */
  commit(): EditedSnapshot<TSerialized> {
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
  private _setValue(id: NodeId, path: PathPart[], newValue: any, isEdit = true, isDelete?: boolean) {
    if (isEdit) {
      this._editedNodeIds.add(id);
    }

    const parent = this._parent.getNodeSnapshot(id);
    const current = this._ensureNewSnapshot(id);
    current.data = lazyImmutableDeepSet(current.data, parent && parent.data, path, newValue, isDelete);
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
