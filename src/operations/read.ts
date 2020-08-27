import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { ParsedQuery, ParsedQueryNode } from '../ParsedQueryNode';
import { JsonObject, JsonValue, PathPart } from '../primitive';
import { NodeId, OperationInstance, RawOperation, StaticNodeId } from '../schema';
import { isNil, isObject, walkOperation, deepGet } from '../util';

import { nodeIdForParameterizedValue } from './SnapshotEditor';

export interface QueryResult {
  /** The value of the root requested by a query. */
  result?: JsonObject;
  /** Whether the query's selection set was satisfied. */
  complete: boolean;
  /** The ids of entity nodes selected by the query. */
  entityIds?: Set<NodeId>;
  /** The ids of nodes overlaid on top of static cache results. */
  dynamicNodeIds?: Set<NodeId>;
}

export interface QueryResultWithNodeIds extends QueryResult {
  /** The ids of entity nodes selected by the query. */
  entityIds: Set<NodeId>;
}

/**
 * Get you some data.
 */
export function read(context: CacheContext, raw: RawOperation, snapshot: GraphSnapshot, includeNodeIds: true): QueryResultWithNodeIds;
export function read(context: CacheContext, raw: RawOperation, snapshot: GraphSnapshot, includeNodeIds?: boolean): QueryResult;
export function read(context: CacheContext, raw: RawOperation, snapshot: GraphSnapshot, includeNodeIds?: boolean) {
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
    queryResult.result = snapshot.getNodeData(operation.rootId);

    if (!operation.isStatic) {
      const dynamicNodeIds = new Set<NodeId>();
      queryResult.result = _walkAndOverlayDynamicValues(operation, context, snapshot, queryResult.result, dynamicNodeIds!);
      queryResult.dynamicNodeIds = dynamicNodeIds;
    }

    queryResult.entityIds = includeNodeIds ? new Set<NodeId>() : undefined;

    // When strict mode is disabled, we carry completeness forward for observed
    // queries.  Once complete, always complete.
    if (typeof queryResult.complete !== 'boolean') {
      queryResult.complete = _visitSelection(operation, context, queryResult.result, queryResult.entityIds);
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
export function _walkAndOverlayDynamicValues(
  query: OperationInstance,
  context: CacheContext,
  snapshot: GraphSnapshot,
  result: JsonObject | undefined,
  dynamicNodeIds: Set<NodeId>,
): JsonObject | undefined {
  // Corner case: We stop walking once we reach a parameterized field with no
  // snapshot, but we should also preemptively stop walking if there are no
  // dynamic values to be overlaid
  const rootSnapshot = snapshot.getNodeSnapshot(query.rootId);
  if (isNil(rootSnapshot)) return result;

  // TODO: A better approach here might be to walk the outbound references from
  // each node, rather than walking the result set.  We'd have to store the path
  // on parameterized value nodes to make that happen.

  const newResult = _wrapValue(result, context) as JsonObject;
  // TODO: This logic sucks.  We'd do much better if we had knowledge of the
  // schema.  Can we layer that on in such a way that we can support uses w/ and
  // w/o a schema compilation step?
  const queue = [new OverlayWalkNode(newResult, query.rootId, query.parsedQuery, [])];

  while (queue.length) {
    const walkNode = queue.pop()!;
    const { value, parsedMap } = walkNode;
    let { containerId, path } = walkNode;
    const valueId = context.entityIdForValue(value);
    if (valueId) {
      containerId = valueId;
      path = [];
    }

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
          let typeName = value.__typename as string;
          if (!typeName && containerId === StaticNodeId.QueryRoot) {
            typeName = 'Query'; // Preserve the default cache's behavior.
          }

          // Should we fall back to a redirect?
          const redirect: CacheContext.ResolverRedirect | undefined = deepGet(context.resolverRedirects, [typeName, fieldName]) as any;
          if (redirect) {
            childId = redirect(node.args);
            if (!isNil(childId)) {
              childSnapshot = snapshot.getNodeSnapshot(childId);
            }
          }
        }

        // Still no snapshot? Ok we're done here.
        if (!childSnapshot) continue;

        dynamicNodeIds.add(childId);
        nextContainerId = childId;
        nextPath = [];
        child = childSnapshot.data;
      } else {
        nextPath = [...path, fieldName];
        child = value[fieldName];
      }

      // Have we reached a leaf (either in the query, or in the cache)?
      if (_shouldWalkChildren(child, node)) {
        child = _recursivelyWrapValue(child, context);
        const allChildValues = _flattenGraphQLObject(child, nextPath);

        for (let i = 0; i < allChildValues.length; i++) {
          const item = allChildValues[i];
          queue.push(new OverlayWalkNode(item.value, nextContainerId, node.children ?? {}, item.path));
        }
      }

      // Because key is already a field alias, result will be written correctly
      // using alias as key.
      value[key] = child as JsonValue;
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

function _recursivelyWrapValue<T extends JsonValue>(value: T | undefined, context: CacheContext): T {
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

function _wrapValue<T extends JsonValue>(value: T | undefined, context: CacheContext): T {
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
export function _visitSelection(
  query: OperationInstance,
  context: CacheContext,
  result?: JsonObject,
  nodeIds?: Set<NodeId>,
): boolean {
  let complete = true;
  if (nodeIds && result !== undefined) {
    nodeIds.add(query.rootId);
  }

  // TODO: Memoize per query, and propagate through cache snapshots.
  walkOperation(query.info.parsed, result, (value, fields) => {
    if (value === undefined) {
      complete = false;
    }

    // If we're not including node ids, we can stop the walk right here.
    if (!complete) return !nodeIds;

    if (!isObject(value)) return false;

    if (nodeIds && isObject(value)) {
      const nodeId = context.entityIdForValue(value);
      if (nodeId !== undefined) {
        nodeIds.add(nodeId);
      }
    }

    for (const field of fields) {
      if (!(field in value)) {
        complete = false;
        break;
      }
    }

    return false;
  });

  return complete;
}
