import { PathPart } from '../primitive';
import { nodeIdForParameterizedValue } from './SnapshotEditor';
import { walkOperation } from '../util/tree';
import { Configuration } from '../Configuration';
import { GraphSnapshot } from '../GraphSnapshot';
import { NodeId, Query } from '../schema';
import {
  expandEdgeArguments,
  isObject,
  ParameterizedEdge,
  ParameterizedEdgeMap,
  parameterizedEdgesForOperation,
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

class OverlayWalkNode {
  constructor(
    public readonly value: any,
    public readonly containerId: NodeId,
    public readonly edgeMap: ParameterizedEdgeMap,
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
  query: Query,
  config: Configuration,
  snapshot: GraphSnapshot,
  edges: ParameterizedEdgeMap,
  result: any,
): any {
  // Corner case: We stop walking once we reach a parameterized edge with no
  // snapshot, but we should also pre-emptively stop walking if there are no
  // parameterized edges at all for the selection.
  const rootSnapshot = snapshot.getSnapshot(query.rootId);
  if (!rootSnapshot || !rootSnapshot.outbound) {
    // For now, what's probably good enough is to just stop the walk if we have
    // no root snapshot making outbound references to any other edges.
    return undefined;
  }

  // TODO: A better approach here might be to walk the outbound references from
  // each node, rather than walking the result set.  We'd have to store the path
  // on parameterized value nodes to make that happen.

  // TODO: Switch back to Object.create() once we fix shit
  const newResult = result ? { ...result } : {};
  // TODO: This logic sucks.  We'd do much better if we had knowledge of the
  // schema.  Can we layer that on in such a way that we can support uses w/ and
  // w/o a schema compilation step?
  const queue = [new OverlayWalkNode(newResult, query.rootId, edges, [])];

  while (queue.length) {
    const { value, containerId, edgeMap, path } = queue.pop() as OverlayWalkNode;

    for (const key in edgeMap) {
      let edge = edgeMap[key] as any;
      let child, childId;
      if (edge instanceof ParameterizedEdge) {
        const args = expandEdgeArguments(edge, query.variables);
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
        childId = config.entityIdForNode(child);
      }

      // Should we continue the walk?
      if (edge) {
        if (Array.isArray(child)) {
          child = [...child];
          for (let i = child.length - 1; i >= 0; i--) {
            if (child[i] === undefined) {
              child[i] = {};
            }

            // Give our array children a chance to start a new path.
            childId = config.entityIdForNode(child[i]) || childId;
            const newPath = childId ? [] : [...path, key, i];
            queue.push(new OverlayWalkNode(child[i], childId || containerId, edge, newPath));
          }

        } else {
          // TODO: Switch back to Object.create() once we fix shit
          child = child ? { ...child } : {};
          const newPath = childId ? [] : [...path, key];
          queue.push(new OverlayWalkNode(child, childId || containerId, edge, newPath))
        }
      }

      value[key] = child;
    }
  }

  return newResult;
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
    if (value === undefined) {
      complete = false;
    }

    // If we're not including node ids, we can stop the walk right here.
    if (!complete) return !includeNodeIds;

    if (!isObject(value)) return false;

    if (nodeIds && isObject(value)) {
      const nodeId = config.entityIdForNode(value);
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
