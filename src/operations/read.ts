import { FieldFunctionOptions } from '@apollo/client/cache/inmemory/policies';
import { isReference, makeReference, Reference, StoreValue } from '@apollo/client';
import { StoreObject } from '@apollo/client/utilities';
import { ReadFieldOptions } from '@apollo/client/cache/core/types/common';
import type { DocumentNode } from 'graphql';

import { CacheContext } from '../context';
import { GraphSnapshot, NodeSnapshotMap } from '../GraphSnapshot';
import { ParsedQuery, ParsedQueryNode } from '../ParsedQueryNode';
import { JsonObject, JsonValue, PathPart } from '../primitive';
import { NodeId, OperationInstance, RawOperation, StaticNodeId } from '../schema';
import { isNil, isObject, walkOperation, deepGet, lazyImmutableDeepSet } from '../util';
import { cloneNodeSnapshot, EntitySnapshot, NodeSnapshot } from '../nodes';

import { nodeIdForParameterizedValue } from './SnapshotEditor';

export type MissingTree =
  | string
  | {
  readonly [key: string]: MissingTree,
};

export class MissingFieldError extends Error {
  constructor(
    public readonly message: string,
    public readonly path: MissingTree | Array<string | number>,
    public readonly query: DocumentNode,
    public readonly variables?: Record<string, any>
  ) {
    // 'Error' breaks prototype chain here
    super(message);

    if (Array.isArray(this.path)) {
      this.missing = this.message;
      for (let i = this.path.length - 1; i >= 0; --i) {
        this.missing = { [this.path[i]]: this.missing };
      }
    } else {
      this.missing = this.path;
    }

    // We're not using `Object.setPrototypeOf` here as it isn't fully supported
    // on Android (see issue #3236).
    // eslint-disable-next-line no-proto
    (this as any).__proto__ = MissingFieldError.prototype;
  }

  public readonly missing: MissingTree;
}

export interface QueryResult {
  /** The value of the root requested by a query. */
  result?: JsonObject;
  /** Whether the query's selection set was satisfied. */
  complete: boolean;
  /** The ids of entity nodes selected by the query. */
  entityIds?: Set<NodeId>;
  /** The ids of nodes overlaid on top of static cache results. */
  dynamicNodeIds?: Set<NodeId>;
  missing?: MissingFieldError[];
  fromOptimisticTransaction?: boolean;
}

export interface QueryResultWithNodeIds extends QueryResult {
  /** The ids of entity nodes selected by the query. */
  entityIds: Set<NodeId>;
}

/**
 * Get you some data.
 */
export function read<TSerialized>(
  context: CacheContext<TSerialized>,
  raw: RawOperation,
  snapshot: GraphSnapshot,
  tempStore?: NodeSnapshotMap,
  includeNodeIds?: true,
): QueryResultWithNodeIds;

export function read<TSerialized>(
  context: CacheContext<TSerialized>,
  raw: RawOperation,
  snapshot: GraphSnapshot,
  tempStore?: NodeSnapshotMap,
  includeNodeIds?: boolean,
): QueryResult;

export function read<TSerialized>(
  context: CacheContext<TSerialized>,
  raw: RawOperation,
  snapshot: GraphSnapshot,
  tempStore: NodeSnapshotMap = Object.create(null),
  includeNodeIds?: boolean,
) {
  let tracerContext;
  if (context.tracer.readStart) {
    tracerContext = context.tracer.readStart(raw);
  }

  const operation = context.parseOperation(raw);

  // Retrieve the previous result (may be partially complete), or start anew.
  const queryResult = snapshot.readCache.get(operation) || {} as Partial<QueryResultWithNodeIds>;
  snapshot.readCache.set(operation, queryResult as QueryResult);

  let cacheHit = true;
  if (!queryResult.result) {
    cacheHit = false;
    const nodeSnapshot = snapshot.getNodeSnapshot(operation.rootId) ?? {};
    const { data, outbound } = nodeSnapshot;
    queryResult.result = data as JsonObject;

    if (
      (!operation.isStatic && (data || outbound || context.typePolicies)) ||
      (operation.parsedQuery.__typename && data && !('__typename' in (data as JsonObject)))
    ) {
      const dynamicNodeIds = new Set<NodeId>();
      queryResult.result = _walkAndOverlayDynamicValues(operation, context, snapshot, queryResult.result ?? {}, dynamicNodeIds!, tempStore);
      queryResult.dynamicNodeIds = dynamicNodeIds;
    }

    queryResult.entityIds = includeNodeIds ? new Set<NodeId>() : undefined;

    // When strict mode is disabled, we carry completeness forward for observed
    // queries.  Once complete, always complete.
    if (typeof queryResult.complete !== 'boolean') {
      const missing: MissingFieldError[] = [];
      queryResult.complete = _visitSelection(operation, context, queryResult.result, queryResult.entityIds, missing);
      if (missing.length) {
        queryResult.missing = missing;
      }
    }
  }

  // We can potentially ask for results without node ids first, and then follow
  // up with an ask for them.  In that case, we need to fill in the cache a bit
  // more.
  if (includeNodeIds && !queryResult.entityIds) {
    cacheHit = false;
    const entityIds = new Set<NodeId>();
    const complete = _visitSelection(operation, context, queryResult.result, entityIds);
    queryResult.complete = complete;
    queryResult.entityIds = entityIds;
  }

  if (context.tracer.readEnd) {
    const result = { result: queryResult as QueryResult, cacheHit };
    context.tracer.readEnd(operation, result, tracerContext);
  }

  return queryResult;
}

class OverlayWalkNode {
  constructor(
    public readonly value: JsonObject,
    public readonly containerId: NodeId,
    public readonly parsedMap: ParsedQuery,
    public readonly path: PathPart[],
  ) {}
}

/**
 * Walks a parameterized field map, overlaying values at those paths on top of
 * existing results.
 *
 * Overlaid values are objects with prototypes pointing to the original results,
 * and new properties pointing to the parameterized values (or objects that
 * contain them).
 */
export function _walkAndOverlayDynamicValues<TSerialized>(
  query: OperationInstance<TSerialized>,
  context: CacheContext<TSerialized>,
  snapshot: GraphSnapshot,
  result: JsonObject | undefined,
  dynamicNodeIds: Set<NodeId>,
  tempStore: NodeSnapshotMap,
): JsonObject | undefined {
  // Corner case: We stop walking once we reach a parameterized field with no
  // snapshot, but we should also preemptively stop walking if there are no
  // dynamic values to be overlaid
  const id = query.rootId;
  const isRoot = id === StaticNodeId.QueryRoot;
  const rootSnapshot: Readonly<NodeSnapshot> | undefined
    = snapshot.getNodeSnapshot(id)
      ?? isRoot
      ? {}
      : undefined;
  if (isNil(rootSnapshot)) return result;

  // TODO: A better approach here might be to walk the outbound references from
  // each node, rather than walking the result set.  We'd have to store the path
  // on parameterized value nodes to make that happen.

  const newResult = _wrapValue(result, context) as JsonObject;
  // TODO: This logic sucks.  We'd do much better if we had knowledge of the
  // schema.  Can we layer that on in such a way that we can support uses w/ and
  // w/o a schema compilation step?
  const queue = [new OverlayWalkNode(newResult, id, query.parsedQuery, [])];

  function readFromSnapshot(obj: Readonly<NodeSnapshot>, key: string) {
    const data = obj.data;
    if (!data || typeof data !== 'object') {
      return undefined;
    }
    if (key in data) {
      return data[key];
    }
    for (const out of obj.outbound ?? []) {
      if (out.path[0] === key) {
        return snapshot.getNodeData(out.id);
      }
    }
    if (isRoot && key === '__typename') {
      return 'Query';
    }
    return undefined;
  }

  const readField = (
    fieldNameOrOptions: string | ReadFieldOptions,
    from: StoreObject | Reference = rootSnapshot.data as StoreObject
  ) => {
    if (!from) {
      return undefined;
    }
    if (typeof fieldNameOrOptions !== 'string') throw new Error('Not implemented');

    if (isReference(from)) {
      const ref = from.__ref;
      const obj = tempStore[ref] ?? snapshot.getNodeSnapshot(ref);
      if (!obj) {
        return undefined;
      }
      return readFromSnapshot(obj, fieldNameOrOptions);
    } else {
      return from[fieldNameOrOptions];
    }
  };

  function getSnapshot(nodeId: string) {
    return tempStore[nodeId] ?? snapshot.getNodeSnapshot(nodeId);
  }

  const ensureNewSnapshot = (nodeId: NodeId): NodeSnapshot => {
    const parent = getSnapshot(nodeId);

    // TODO: We're assuming that the only time we call _ensureNewSnapshot when
    // there is no parent is when the node is an entity.  Can we enforce it, or
    // pass a type through?
    const newSnapshot = parent ? cloneNodeSnapshot(parent) : new EntitySnapshot();
    tempStore[nodeId] = newSnapshot;
    return newSnapshot;
  };

  const readOptions: FieldFunctionOptions = {
    args: {},
    cache: null as any,
    canRead(value: StoreValue): boolean {
      return isReference(value)
        ? snapshot.has(value.__ref)
        : typeof value === 'object' && value !== null;
    },
    field: null,
    fieldName: '',
    isReference,
    mergeObjects<T>(existing: T, incoming: T): T {
      return { ...existing, ...incoming };
    },
    readField,
    storage: rootSnapshot,
    storeFieldName: '',
    toReference: (value, mergeIntoStore) => {
      const entityId = context.entityIdForValue(value);
      if (entityId && mergeIntoStore && !isReference(value) && typeof value !== 'string') {
        const nodeSnapshot = ensureNewSnapshot(entityId);
        nodeSnapshot.data = { ...nodeSnapshot.data as {}, ...value };
      }
      return entityId ? makeReference(entityId) : undefined;
    },
    variables: query.variables,
  };

  while (queue.length) {
    const walkNode = queue.pop()!;
    const { value, parsedMap } = walkNode;
    let { containerId, path } = walkNode;
    const valueId = context.entityIdForValue(value);
    if (valueId) {
      containerId = valueId;
      path = [];
    }

    let typeName = value.__typename as string;
    if (!typeName && containerId === StaticNodeId.QueryRoot && path.length === 0) {
      typeName = 'Query'; // Preserve the default cache's behavior.
    }
    const typePolicies = context.typePolicies?.[typeName]?.fields;

    for (const key in parsedMap) {
      const node = parsedMap[key];
      let child;
      let fieldName = key;

      // This is an alias if we have a schemaName declared.
      fieldName = node.schemaName ? node.schemaName : key;

      let nextContainerId = containerId;
      let nextPath = path;

      if (node.args) {
        let childId = nodeIdForParameterizedValue(containerId, [...path, fieldName], node.args);
        let childSnapshot = snapshot.getNodeSnapshot(childId);
        if (!childSnapshot) {

          // Should we fall back to a redirect?
          const redirect: CacheContext.ResolverRedirect | undefined = deepGet(context.resolverRedirects, [typeName, fieldName]) as any;
          if (redirect) {
            childId = redirect(node.args);
            if (!isNil(childId)) {
              childSnapshot = snapshot.getNodeSnapshot(childId);
            }
          } else if (typePolicies) {
            const fieldPolicy = typePolicies[fieldName];
            const readFn = fieldPolicy && (typeof fieldPolicy === 'object' ? fieldPolicy.read : fieldPolicy);
            if (readFn) {
              readOptions.fieldName = fieldName;
              readOptions.storeFieldName = key;
              readOptions.args = node.args;
              const readResult = readFn(undefined, readOptions);
              if (isReference(readResult)) {
                const ref = readResult.__ref;
                childSnapshot = getSnapshot(ref);
              } else {
                child = readResult;
              }
            }
          }
        }
        dynamicNodeIds.add(childId);

        // Still no snapshot? Ok we're done here.
        if (!childSnapshot) {
          continue;
        }

        nextContainerId = childId;
        nextPath = [];
        child = childSnapshot.data;
      } else {
        nextPath = [...path, fieldName];
        child = value[fieldName];
        const policy = typePolicies?.[fieldName];
        const readFn = typeof policy === 'function' ? policy : policy?.read;
        if (readFn) {
          readOptions.fieldName = fieldName;
          readOptions.storeFieldName = key;
          readOptions.args = node.args ?? null;
          child = readFn(child, readOptions);
        }
      }

      let ref;
      if (isReference(child)) {
        ref = child.__ref;
        child = snapshot.getNodeSnapshot(ref)?.data;
      }

      const hasPolicy = child && context.typePolicies?.[child.__typename]?.fields;

      // Have we reached a leaf (either in the query, or in the cache)?
      if (hasPolicy || ref || _shouldWalkChildren(child, node)) {
        child = _recursivelyWrapValue(child, context);
        const allChildValues = _flattenGraphQLObject(child, nextPath);

        for (let i = 0; i < allChildValues.length; i++) {
          const item = allChildValues[i];
          queue.push(new OverlayWalkNode(item.value, nextContainerId, node.children ?? {}, item.path));
        }
      }

      // Because key is already a field alias, result will be written correctly
      // using alias as key.
      if (child === undefined && key === '__typename' && typeName) {
        value.__typename = typeName;
      } else {
        value[key] = child ?? null as JsonValue;
      }
    }
  }

  return newResult;
}

/**
 *  Private: Represents the possible types of a GraphQL object.
 *
 *  Since we are not using the schema when walking through the result and
 *  overlaying values, we do not know if a field represents an object, an array
 *  of objects, or a multidimensional array of objects. The query alone is
 *  ambiguous.
 */
type UnknownGraphQLObject = JsonObject | null | UnknownGraphQLObjectArray;
interface UnknownGraphQLObjectArray extends Array<UnknownGraphQLObject> {}

/**
 *  Check if `value` is an object and if any of its children are parameterized.
 *  We can skip this part of the graph if there are no parameterized children
 *  to resolve.
 */
function _shouldWalkChildren(
  value: JsonValue | undefined,
  node: ParsedQueryNode
): value is UnknownGraphQLObject {
  return !!node.hasParameterizedChildren && !!node.children && value !== null;
}

/**
 *  Private: Represents and location and value of objects discovered while
 *  flattening the value of a graphql object field.
 */
type FlattenedGraphQLObject = { value: JsonObject, path: PathPart[] };

/**
 *  Finds all of the actual objects in `value` which can be a single object, an
 *  array of objects, or a multidimensional array of objects, and returns them
 *  as a flat list.
 */
function _flattenGraphQLObject(value: UnknownGraphQLObject, path: PathPart[]): FlattenedGraphQLObject[] {
  if (value === null) return [];
  if (!Array.isArray(value)) return [{ value, path }];

  const flattened = [];

  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    const list = _flattenGraphQLObject(item, [...path, i]);

    flattened.push(...list);
  }

  return flattened;
}

function _recursivelyWrapValue<T extends JsonValue, TSerialized>(value: T | undefined, context: CacheContext<TSerialized>): T {
  if (!Array.isArray(value)) {
    return _wrapValue(value, context);
  }

  const newValue = [];
  // Note that we're careful to iterate over all indexes, in case this is a
  // sparse array.
  for (let i = 0; i < value.length; i++) {
    newValue[i] = _recursivelyWrapValue(value[i], context);
  }

  return newValue as T;
}

function _wrapValue<T extends JsonValue, TSerialized>(value: T | undefined, context: CacheContext<TSerialized>): T {
  if (value === undefined) {
    return {} as T;
  }
  if (Array.isArray(value)) {
    return [...value] as T;
  }
  if (isObject(value)) {
    const newValue = { ...(value as any) };
    if (context.entityTransformer && context.entityIdForValue(value)) {
      context.entityTransformer(newValue);
    }
    return newValue;
  }
  return value;
}

/**
 * Determines whether `result` satisfies the properties requested by
 * `selection`.
 */
export function _visitSelection<TSerialized>(
  query: OperationInstance<TSerialized>,
  context: CacheContext<TSerialized>,
  result?: JsonObject,
  nodeIds?: Set<NodeId>,
  missing?: MissingFieldError[],
): boolean {
  let complete = true;
  if (nodeIds && result !== undefined) {
    nodeIds.add(query.rootId);
  }
  const missingByFieldName = new Map<string, MissingFieldError>();

  // TODO: Memoize per query, and propagate through cache snapshots.
  walkOperation(query.info.parsed, result, (value, fields, path) => {
    if (value === undefined) {
      complete = false;
    }

    // If we're not including node ids, we can stop the walk right here.
    if (!complete && !missing) {
      return !nodeIds;
    }

    if (!isObject(value)) {
      return false;
    }

    if (nodeIds && isObject(value)) {
      const nodeId = context.entityIdForValue(value);
      if (nodeId !== undefined) {
        nodeIds.add(nodeId);
      }
    }

    for (const field of fields) {
      if (!(field in value) && field !== '__typename') {
        let missingError = missingByFieldName.get(field);
        const nodeId = context.entityIdForValue(value);
        const objOrNodeId = nodeId ? `${nodeId} object` : `object ${JSON.stringify(value, undefined, 2)}`;
        const message = `Can't find field '${field}' on ${objOrNodeId}`;
        if (!missingError) {
          const missingTree: MissingTree = {};
          lazyImmutableDeepSet(missingTree, undefined, [...path, field], message);
          missingByFieldName.set(field, missingError = new MissingFieldError(
            message,
            missingTree,
            query.info.document,
            query.variables ?? {},
          ));
        } else {
          const missingTree = missingError.path as {
            readonly [key: string]: MissingTree,
          };
          lazyImmutableDeepSet(missingTree, undefined, [...path, field], message);
        }
        complete = false;
      }
    }

    return false;
  });

  for (const error of missingByFieldName.values()) {
    missing?.push(error);
  }

  return complete;
}
