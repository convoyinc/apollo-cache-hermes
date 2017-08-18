import { PathPart } from '../primitive';
import { nodeIdForParameterizedValue } from './SnapshotEditor';
import { walkOperation } from '../util';
import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { NodeId, ParsedQuery, Query } from '../schema';
import {
  expandEdgeArguments,
  isObject,
  Edge,
  EdgeMap,
} from '../util';

export interface QueryResult {
  /** The value of the root requested by a query. */
  result: any;
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

    const { parameterizedEdgeMap } = parsed.info;
    if (parameterizedEdgeMap) {
      result = _overlayParameterizedValues(parsed, context, snapshot, parameterizedEdgeMap, result);
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
    public readonly value: any,
    public readonly containerId: NodeId,
    public readonly edgeMap: EdgeMap,
    public readonly path: PathPart[],
  ) {}
}

/**
 * Walks a parameterized edge map, overlaying values at those paths on top of
 * existing results.
 *
 * Overlaid values are objects with prototypes pointing to the original results,
 * and new properties pointing to the parameterized values (or objects that
 * contain them).
 */
export function _overlayParameterizedValues(
  query: ParsedQuery,
  context: CacheContext,
  snapshot: GraphSnapshot,
  edges: EdgeMap,
  result: any,
): any {
  // Corner case: We stop walking once we reach a parameterized edge with no
  // snapshot, but we should also pre-emptively stop walking if there are no
  // parameterized edges at all for the selection.
  const rootSnapshot = snapshot.getSnapshot(query.rootId);
  if (!rootSnapshot || !rootSnapshot.outbound) {
    // For now, what's probably good enough is to just stop the walk if we have
    // no root snapshot making outbound references to any other edges.
    return result;
  }

  // TODO: A better approach here might be to walk the outbound references from
  // each node, rather than walking the result set.  We'd have to store the path
  // on parameterized value nodes to make that happen.

  const newResult = _wrapValue(result);
  // TODO: This logic sucks.  We'd do much better if we had knowledge of the
  // schema.  Can we layer that on in such a way that we can support uses w/ and
  // w/o a schema compilation step?
  const queue = [new OverlayWalkNode(newResult, query.rootId, edges, [])];

  while (queue.length) {
    const walkNode = queue.pop()!;
    const { value, edgeMap } = walkNode;
    let { containerId, path } = walkNode;
    const valueId = context.entityIdForNode(value);
    if (valueId) {
      containerId = valueId;
      path = [];
    }

    for (const key in edgeMap) {
      let edge = edgeMap[key] as any;
      let child, childId;
      if (edge instanceof Edge) {
        const args = edge.parameterizedArguments ?
          expandEdgeArguments(edge.parameterizedArguments, query.variables) : {};
        childId = nodeIdForParameterizedValue(containerId, [...path, key], args);
        const childSnapshot = snapshot.getSnapshot(childId);
        if (childSnapshot) {
          edge = edge.children;
          child = childSnapshot.node;
        } else {
          // Stop walking any further down.
          edge = undefined;
        }
      } else {
        child = value[key];
      }

      // Should we continue the walk?
      if (edge && child !== null) {
        if (Array.isArray(child)) {
          child = [...child];
          for (let i = child.length - 1; i >= 0; i--) {
            child[i] = _wrapValue(child[i]);
            queue.push(new OverlayWalkNode(child[i], containerId, edge, [...path, key, i]));
          }

        } else {
          child = _wrapValue(child);
          queue.push(new OverlayWalkNode(child, containerId, edge, [...path, key]))
        }
      }

      value[key] = child;
    }
  }

  return newResult;
}

function _wrapValue(value: any): any {
  if (value === undefined) return {};
  if (Array.isArray(value)) return [...value];
  // TODO: Switch back to Object.create() once we fix shit
  if (isObject(value)) return { ...value };
  return value;
}

/**
 * Determines whether `result` satisfies the properties requested by `selection`.
 */
export function _visitSelection(
  query: ParsedQuery,
  context: CacheContext,
  result: any,
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
