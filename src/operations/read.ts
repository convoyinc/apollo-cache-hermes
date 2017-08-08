import { walkOperation } from '../util/tree';
import { Configuration } from '../Configuration';
import { GraphSnapshot } from '../GraphSnapshot';
import { NodeId, Query } from '../schema';
import { ParameterizedEdgeMap, isObject, parameterizedEdgesForOperation } from '../util';

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
export function read(config: Configuration, query: Query, snapshot: GraphSnapshot): QueryResult;
export function read(config: Configuration, query: Query, snapshot: GraphSnapshot, includeNodeIds: true): QueryResultWithNodeIds;
export function read(config: Configuration, query: Query, snapshot: GraphSnapshot, includeNodeIds?: true) {
  let result = snapshot.get(query.rootId);

  const parameterizedEdges = parameterizedEdgesForOperation(query.document);
  if (parameterizedEdges) {
    result = _overlayParameterizedValues(query, config, snapshot, parameterizedEdges, result);
  }

  const { complete, nodeIds } = _visitSelection(query, config, result, includeNodeIds);

  return { result, complete, nodeIds };
}

/**
 * Walks a parameterized edge map, overlaying values at those paths on top of
 * existing results.
 *
 * Overlaid values are objects with prototypes pointing to the original results,
 * and new properties pointing to the parameterized values (or objects that
 * contain them).
 */
export function _overlayParameterizedValues<TResult>(
  query: Query,
  config: Configuration,
  snapshot: GraphSnapshot,
  edges: ParameterizedEdgeMap,
  result: TResult,
): TResult {
  // Rough algorithm is as follows:
  //
  //   * Visit each node of `edges`, along side `result`:
  //
  //     * Determine the node id (if any) via config.entityIdForNode, and track
  //       it along side the current path.
  //
  //     * If we've reached a parameterized field node in the edge map:
  //
  //       * Determine the id of the parameterized edge (closest nodeId +
  //         parameters).
  //
  //       * Fetch the value of that node from the snapshot, and assign it to
  //         the newly constructed parent (see the next step).
  //
  //     * Otherwise, construct a new object whose prototype is the value of the
  //       results at this path.
  //
  // Return the new copy of the results with overlaid edges.
  //

  // Random line to get ts/tslint to shut up.
  return _overlayParameterizedValues(query, config, snapshot, edges, result);
}

/**
 * Determines whether `result` satisfies the properties requested  `selection`.
 */
export function _visitSelection(
  query: Query,
  config: Configuration,
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
  walkOperation(query.document, result, (value, fields) => {
    // TODO: Stop the walk if we're not complete and not requesting node ids.
    if (nodeIds && isObject(value)) {
      const nodeId = config.entityIdForNode(value);
      if (nodeId !== undefined) {
        nodeIds.add(nodeId);
      }
    }

    if (value === undefined) {
      complete = false;
    }

    // If we're not including node ids, we can stop the walk right here.
    if (!complete) return !includeNodeIds;

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
