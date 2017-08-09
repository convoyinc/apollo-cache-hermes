import { PathPart } from '../primitive';

import { ParameterizedEdge, ParameterizedEdgeMap } from './ast';

/**
 * Represents a node (of all values at the same location in their trees), used
 * by the depth-first walk.
 */
class WalkNode {
  constructor(
    /** The value of the payload at this location in the walk. */
    public readonly payload: any,
    /** The value of the current node at this location in the walk. */
    public readonly node: any,
    /** The value of the edge map at this location in the walk. */
    public readonly edgeMap: ParameterizedEdgeMap | ParameterizedEdge | undefined,
    /** The depth of the node (allows us to set the path correctly). */
    public readonly depth: number,
    /** The key/index of this node, relative to its parent. */
    public readonly key?: PathPart,
  ) {}
}

/**
 * A function called when `walkPayload` visits a node in the payload, and any
 * associated values from the node and references.
 */
export type Visitor = (
  path: PathPart[],
  payloadValue: any,
  nodeValue: any,
  parameterizedEdge: ParameterizedEdge | ParameterizedEdgeMap | undefined,
) => void | boolean;

/**
 * Walks a GraphQL payload that contains data to be merged into any existing
 * data stored for the node it represents.
 *
 * The walk is performed in a depth-first fashion, using `payload` as a guide.
 * If `visitor` returns true, the walk will skip any children of the current
 * node, effectively treating it as a leaf.
 *
 * All values from the node are walked following the same path.  Similarly,
 * all values from `edgeMap` are walked, but they are only provided if a leaf
 * (`EntityType`) is reached.  References skip over arrays, so that they apply
 * to the values inside the (homogeneous) array.
 */
export function walkPayload(
  payload: any,
  node: any,
  edgeMap: ParameterizedEdge | ParameterizedEdgeMap | undefined,
  visitRoot: boolean,
  visitor: Visitor,
) {
  // We perform a pretty standard depth-first traversal, with the addition of
  // tracking the current path at each node.
  const stack = [new WalkNode(payload, node, edgeMap, 0)];
  const path = [] as PathPart[];

  while (stack.length) {
    const walkNode = stack.pop() as WalkNode;

    // Don't visit the root.
    if (walkNode.key !== undefined || visitRoot) {
      path.splice(walkNode.depth - 1);
      if (walkNode.key !== undefined) {
        path.push(walkNode.key);
      }

      const skipChildren = visitor(path, walkNode.payload, walkNode.node, walkNode.edgeMap);
      if (skipChildren) continue;
    }

    // Note that in all cases, we push nodes onto the stack in _reverse_ order,
    // so that we visit nodes in iteration order (the stack is FIFO).
    const newDepth = walkNode.depth + 1;
    if (Array.isArray(walkNode.payload)) {
      for (let index = walkNode.payload.length - 1; index >= 0; index--) {
        // Note that we DO NOT walk into `edgeMap` for array values; the edge
        // map is blind to them, and continues to apply to all values contained
        // within the array.
        stack.push(new WalkNode(get(walkNode.payload, index), get(walkNode.node, index), walkNode.edgeMap, newDepth, index));
      }
    } else if (walkNode.payload !== null && typeof walkNode.payload === 'object') {
      const keys = Object.getOwnPropertyNames(walkNode.payload);
      for (let index = keys.length - 1; index >= 0; index--) {
        const key = keys[index];
        stack.push(new WalkNode(get(walkNode.payload, key), get(walkNode.node, key), get(walkNode.edgeMap, key), newDepth, key));
      }
    }

  }
}

function get(value: any, key: PathPart) {
  // Remember: arrays are typeof 'object', too.
  return value !== null && typeof value === 'object' ? value[key] : undefined;
}
