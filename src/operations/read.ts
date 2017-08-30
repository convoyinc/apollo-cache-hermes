import { JsonObject, JsonValue, PathPart } from '../primitive';
import { expandFieldArguments, DynamicField, DynamicFieldMap } from '../DynamicField';
import { nodeIdForParameterizedValue } from './SnapshotEditor';
import { walkOperation } from '../util';
import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { NodeId, ParsedQuery, Query } from '../schema';
import { isObject } from '../util';

export interface QueryResult {
  /** The value of the root requested by a query. */
  result?: JsonObject;
  /** Whether the query's selection set was satisfied. */
  complete: boolean;
}

export interface QueryResultWithNodeIds extends QueryResult {
  /** The ids of nodes selected by the query (if requested). */
  nodeIds: Set<NodeId>;
}

/**
 * Get you some datas.
 */
export function read(context: CacheContext, query: Query, snapshot: GraphSnapshot): QueryResult;
export function read(context: CacheContext, query: Query, snapshot: GraphSnapshot, includeNodeIds: true): QueryResultWithNodeIds;
export function read(context: CacheContext, query: Query, snapshot: GraphSnapshot, includeNodeIds?: true) {
  const parsed = context.parseQuery(query);
  let queryResult = snapshot.readCache.get(parsed) as Partial<QueryResultWithNodeIds>;
  if (!queryResult) {
    let result = snapshot.get(parsed.rootId);

    const { dynamicFieldMap } = parsed.info;
    if (dynamicFieldMap) {
      result = _walkAndOverlayDynamicValues(parsed, context, snapshot, dynamicFieldMap, result);
    }

    const { complete, nodeIds } = _visitSelection(parsed, context, result, includeNodeIds);

    queryResult = { result, complete, nodeIds };
    snapshot.readCache.set(parsed, queryResult as QueryResult);
  }

  // We can potentially ask for results without node ids first, and then follow
  // up with an ask for them.  In that case, we need to fill in the cache a bit
  // more.
  if (includeNodeIds && !queryResult.nodeIds) {
    const { complete, nodeIds } = _visitSelection(parsed, context, queryResult.result, includeNodeIds);
    queryResult.complete = complete;
    queryResult.nodeIds = nodeIds;
  }

  return queryResult;
}

class OverlayWalkNode {
  constructor(
    public readonly value: JsonObject,
    public readonly containerId: NodeId,
    public readonly fieldMap: DynamicFieldMap,
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
  query: ParsedQuery,
  context: CacheContext,
  snapshot: GraphSnapshot,
  fields: DynamicFieldMap,
  result: JsonObject,
): JsonObject {
  // Corner case: We stop walking once we reach a parameterized field with no
  // snapshot, but we should also pre-emptively stop walking if there are no

  // dynamic values to be overlaid
  const rootSnapshot = snapshot.getNodeSnapshot(query.rootId);

  // It is possible to have no outbound but there is still an dynamic field
  // that need to be overlaid (i.e. alias)
  if (!rootSnapshot || !(rootSnapshot.outbound || fields)) {
    // For now, what's probably good enough is to just stop the walk if we have
    // no root snapshot making outbound references to any other fields.
    return result;
  }

  // TODO: A better approach here might be to walk the outbound references from
  // each node, rather than walking the result set.  We'd have to store the path
  // on parameterized value nodes to make that happen.

  const newResult = _wrapValue(result);
  // TODO: This logic sucks.  We'd do much better if we had knowledge of the
  // schema.  Can we layer that on in such a way that we can support uses w/ and
  // w/o a schema compilation step?
  const queue = [new OverlayWalkNode(newResult, query.rootId, fields, [])];

  while (queue.length) {
    const walkNode = queue.pop()!;
    const { value, fieldMap } = walkNode;
    let { containerId, path } = walkNode;
    const valueId = context.entityIdForNode(value);
    if (valueId) {
      containerId = valueId;
      path = [];
    }

    for (const key in fieldMap) {
      let field: DynamicFieldMap | DynamicField | undefined = fieldMap[key];
      let child, childId;
      let fieldName = key;

      if (field instanceof DynamicField) {
        // If exist filedName property then the current key is an alias
        fieldName = field.fieldName ? field.fieldName : key;

        if (field.args) {
          const args = expandFieldArguments(field.args, query.variables);
          childId = nodeIdForParameterizedValue(containerId, [...path, fieldName], args);
          const childSnapshot = snapshot.getNodeSnapshot(childId);
          if (childSnapshot) {
            child = childSnapshot.node;
          }
        } else {
          child = value[fieldName];
        }
        field = field!.children;
      } else {
        child = value[key];
      }

      // Should we continue the walk?
      if (field && !(field instanceof DynamicField) && child !== null) {
        if (Array.isArray(child)) {
          child = [...child];
          for (let i = child.length - 1; i >= 0; i--) {
            if (child[i] === null) continue;
            child[i] = _wrapValue(child[i]);
            queue.push(new OverlayWalkNode(child[i], containerId, field as DynamicFieldMap, [...path, fieldName, i]));
          }

        } else {
          child = _wrapValue(child);
          queue.push(new OverlayWalkNode(child, containerId, field as DynamicFieldMap, [...path, fieldName]))
        }
      }

      // Because key is already a field alias, result will be written correctly using alias as key
      value[key] = child;
    }
  }

  return newResult;
}

function _wrapValue(value: JsonValue): any {
  if (value === undefined) return {};
  if (Array.isArray(value)) return [...value];
  if (isObject(value)) return { ...value };
  return value;
}

/**
 * Determines whether `result` satisfies the properties requested by `selection`.
 */
export function _visitSelection(
  query: ParsedQuery,
  context: CacheContext,
  result?: JsonObject,
  includeNodeIds?: true,
): { complete: boolean, nodeIds?: Set<NodeId> } {
  let complete = true;
  let nodeIds: Set<NodeId> | undefined;
  if (includeNodeIds) {
    nodeIds = new Set<NodeId>();
    if (result !== undefined) {
      nodeIds.add(query.rootId);
    }
  }

  // TODO: Memoize per query, and propagate through cache snapshots.
  walkOperation(query.info.document, result, (value, fields) => {
    if (value === undefined) {
      complete = false;
    }

    // If we're not including node ids, we can stop the walk right here.
    if (!complete) return !includeNodeIds;

    if (!isObject(value)) return false;

    if (nodeIds && isObject(value)) {
      const nodeId = context.entityIdForNode(value);
      if (nodeId !== undefined) {
        nodeIds.add(nodeId);
      }
    }

    for (const field of fields) {
      if (!(field.name.value in value)) {
        complete = false;
        break;
      }
    }

    return false;
  });

  return { complete, nodeIds };
}
