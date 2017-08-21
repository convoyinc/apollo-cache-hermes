/**
 * @fileoverview
 *
 * Several specialized tree walkers for cache operations.
 */

import { // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
  DocumentNode,
  FieldNode,
  SelectionSetNode,
} from 'graphql';

import { PathPart } from '../primitive';

import { ParameterizedEdge, ParameterizedEdgeMap, fragmentMapForDocument, getOperationOrDie } from './ast';

/**
 * Represents a node (of all values at the same location in their trees), used
 * by the depth-first walk.
 */
class PayloadWalkNode {
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
export type PayloadVisitor = (
  path: PathPart[],
  payloadValue: any,
  nodeValue: any,
  parameterizedEdge: ParameterizedEdge | ParameterizedEdgeMap | undefined,
) => boolean;

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
  visitor: PayloadVisitor,
) {
  // We perform a pretty standard depth-first traversal, with the addition of
  // tracking the current path at each node.
  const stack = [new PayloadWalkNode(payload, node, edgeMap, /*depth*/ 0)];
  const path: PathPart[] = [];

  while (stack.length) {
    const walkNode = stack.pop()!;

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
    // so that we visit nodes in iteration order (the stack is LIFO).
    const newDepth = walkNode.depth + 1;
    if (Array.isArray(walkNode.payload)) {
      for (let index = walkNode.payload.length - 1; index >= 0; index--) {
        // Note that we DO NOT walk into `edgeMap` for array values; the edge
        // map is blind to them, and continues to apply to all values contained
        // within the array.
        stack.push(new PayloadWalkNode(get(walkNode.payload, index), get(walkNode.node, index), walkNode.edgeMap, newDepth, index));
      }
    } else if (walkNode.payload !== null && typeof walkNode.payload === 'object') {
      const keys = Object.getOwnPropertyNames(walkNode.payload);
      for (let index = keys.length - 1; index >= 0; index--) {
        const key = keys[index];
        stack.push(new PayloadWalkNode(get(walkNode.payload, key), get(walkNode.node, key), get(walkNode.edgeMap, key), newDepth, key));
      }
    }

  }
}

/**
 *
 */
class OperationWalkNode {
  constructor(
    public readonly selectionSet: SelectionSetNode,
    public readonly parent: any,
  ) {}
}

/**
 * Returning true indicates that the walk should STOP.
 */
export type OperationVisitor = (parent: any, fields: FieldNode[]) => boolean;

/**
 *
 */
export function walkOperation(document: DocumentNode, result: any, visitor: OperationVisitor) {
  const operation = getOperationOrDie(document);
  const fragmentMap = fragmentMapForDocument(document);

  // Perform the walk as a depth-first traversal; and unlike the payload walk,
  // we don't bother tracking the path.
  const stack = [new OperationWalkNode(operation.selectionSet, result)];

  while (stack.length) {
    const { selectionSet, parent } = stack.pop() as OperationWalkNode;
    // We consider null nodes to be skippable (and satisfy the walk).
    if (parent === null) continue;

    // Fan-out for arrays.
    if (Array.isArray(parent)) {
      // Push in reverse purely for ergonomics: they'll be pulled off in order.
      for (let i = parent.length - 1; i >= 0; i--) {
        stack.push(new OperationWalkNode(selectionSet, parent[i]));
      }
      continue;
    }

    const fields: FieldNode[] = [];
    // TODO: Directives?
    for (const selection of selectionSet.selections) {
      // A simple field.
      if (selection.kind === 'Field') {
        fields.push(selection);
        if (selection.selectionSet) {
          const child = get(parent, selection.name.value);
          stack.push(new OperationWalkNode(selection.selectionSet, child));
        }

      // Fragments are applied to the current value.
      } else if (selection.kind === 'FragmentSpread') {
        const fragment = fragmentMap[selection.name.value];
        if (!fragment) {
          throw new Error(`Expected fragment ${selection.name.value} to be defined`);
        }
        stack.push(new OperationWalkNode(fragment.selectionSet, parent));

      // TODO: Inline fragments.
      } else {
        throw new Error(`Unsupported GraphQL AST Node ${selection.kind}`);
      }
    }

    if (fields.length) {
      const shouldStop = visitor(parent, fields);
      if (shouldStop) return;
    }
  }
}

function get(value: any, key: PathPart) {
  // Remember: arrays are typeof 'object', too.
  return value !== null && typeof value === 'object' ? value[key] : undefined;
}
