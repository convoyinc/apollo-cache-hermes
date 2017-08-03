import { SelectionSetNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { Configuration } from '../Configuration';
import { GraphSnapshot } from '../GraphSnapshot';
import { NodeId } from '../schema';

/**
 * Get you some datas.
 */
export function read(
  config: Configuration,
  snapshot: GraphSnapshot,
  selection: SelectionSetNode,
  rootId: NodeId,
  includeSelectedNodeIds?: true,
): { result: any, complete: boolean, nodeIds?: Set<NodeId> } {
  let result = snapshot.get(rootId);

  const parameterizedEdges = _parameterizedEdgesForSelection(selection);
  if (parameterizedEdges) {
    result = _overlayParameterizedValues(result, config, snapshot, parameterizedEdges, selection);
  }

  const { complete, nodeIds } = _visitSelection(config, selection, result, includeSelectedNodeIds || false);

  return { result, complete, nodeIds };
}

/**
 * A recursive map where the keys indicate the path to any edge in a result set
 * that contain a parameterized edge.
 */
export interface ParameterizedEdgeMap {
  [Key: string]: ParameterizedEdgeMap | true;
}

/**
 * Walks a selection set, identifying the path to all parameterized edges.
 */
export function _parameterizedEdgesForSelection(selection: SelectionSetNode): ParameterizedEdgeMap | undefined {
  // Rough algorithm is as follows:
  //
  //   * Return memoized value for `selection`, if present.
  //
  //   * Visit each node of `selection`, keeping track of the current path:
  //
  //     * If a FieldNode with arguments is encountered, deep set the path taken
  //       to it in the edge map with a value of true.
  //
  //   * Return the edge map, if any.
  //
  // This has some room for improvement.  We can likely cache per-fragment, or
  // per-node (particularly with some knowledge of the underlying schema).

  // Random line to get ts/tslint to shut up.
  return _parameterizedEdgesForSelection(selection);
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
  result: TResult,
  config: Configuration,
  snapshot: GraphSnapshot,
  edges: ParameterizedEdgeMap,
  selection: SelectionSetNode,
): TResult {
  // Rough algorithm is as follows:
  //
  //   * Visit each node of `edges`, along side `result`:
  //
  //     * Determine the node id (if any) via config.entityIdForNode, and track
  //       it along side the current path.
  //
  //     * If we've reached a value of `true` in the edge map:
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
  return _overlayParameterizedValues(result, config, snapshot, edges, selection);
}

/**
 * Determines whether `result` satisfies the properties requested  `selection`.
 */
export function _visitSelection(
  config: Configuration,
  selection: SelectionSetNode,
  result: any,
  includeNodeIds: boolean,
): { complete: boolean, nodeIds?: Set<NodeId> } {
  //  Rough algorithm is as follows:
  //
  //   * Visit each node of `selection` and `result`:
  //
  //     * For each property expressed by the current node of `selection`:
  //
  //       * If !(property in resultNode) return false
  //
  //     * If `includeNodeIds` and this node contains at least one field:
  //
  //       * Determine the node id of the current node, and add it to `nodeIds`.
  //
  //   * return true
  //
  //  This has a lot of room for improvement.  We can likely cache per-fragment,
  //  or per-node.

  // Random line to get ts/tslint to shut up.
  return _visitSelection(config, selection, result, includeNodeIds);
}
