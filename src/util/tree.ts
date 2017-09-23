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

import { DynamicField, DynamicFieldMap } from '../DynamicField';
import { JsonObject, JsonValue, PathPart } from '../primitive';

import { fragmentMapForDocument, getOperationOrDie } from './ast';

/**
 * Represents a node (of all values at the same location in their trees), used
 * by the depth-first walk.
 */
class PayloadWalkNode {
  constructor(
    /** The value of the payload at this location in the walk. */
    public readonly payload: JsonValue,
    /** The value of the current node at this location in the walk. */
    public readonly node: JsonValue | undefined,
    /** The value of the field map at this location in the walk. */
    public readonly fieldMap: DynamicFieldMap | DynamicField | undefined,
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
  payloadValue: JsonValue,
  nodeValue: JsonValue | undefined,
  dynamicField: DynamicField | DynamicFieldMap | undefined,
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
 * all values from `fieldMap` are walked, but they are only provided if a leaf
 * (`EntityType`) is reached.  References skip over arrays, so that they apply
 * to the values inside the (homogeneous) array.
 */
export function walkPayload(
  payload: JsonValue,
  node: JsonValue | undefined,
  rootFieldMap: DynamicField | DynamicFieldMap | undefined,
  visitRoot: boolean,
  visitor: PayloadVisitor,
) {
  // We perform a pretty standard depth-first traversal, with the addition of
  // tracking the current path at each node.
  const stack = [new PayloadWalkNode(payload, node, rootFieldMap, /* depth */ 0)];
  // Store array of path (which is a name of property in an object) from root
  // node to interested property.
  // i.e. {
  //  user: {
  //    name: "Bob",   -> path = ["user", "name"]
  //    address: {     -> path = ["user", "address"]
  //      city: "A",   -> path = ["user", "address", "city"]
  //      state: "AB", -> path = ["user", "address", "state"]
  //    },
  //    info: {
  //      id: 0,       -> path = ["id"]
  //      prop1: "hi"  -> path = ["prop1"]
  //    },
  //    phone: ["1234", -> path = ["user", 0]
  //            "5678"] -> path = ["user", 1]
  //  }
  // }
  const path: PathPart[] = [];

  while (stack.length) {
    const walkNode = stack.pop()!;
    const { fieldMap, key } = walkNode;

    // Don't visit the root.
    if (key !== undefined || visitRoot) {
      path.splice(walkNode.depth - 1);
      // The type of walkNode's key is number meaning that it is an
      // index to an array and should not undergo de-aliasing.
      if (typeof key === 'number') {
        path.push(key);
      } else if (key !== undefined) {
        const fieldName = fieldMap &&
          fieldMap instanceof DynamicField &&
          fieldMap.fieldName ? fieldMap.fieldName : undefined;
        path.push(fieldName ? fieldName : key);
      }

      const skipChildren = visitor(path, walkNode.payload, walkNode.node, walkNode.fieldMap);
      if (skipChildren) continue;
    }

    // Note that in all cases, we push nodes onto the stack in _reverse_ order,
    // so that we visit nodes in iteration order (the stack is LIFO).
    const newDepth = walkNode.depth + 1;
    if (Array.isArray(walkNode.payload)) {
      for (let index = walkNode.payload.length - 1; index >= 0; index--) {
        // Note that we DO NOT walk into `fieldMap` for array values; the field
        // map is blind to them, and continues to apply to all values contained
        // within the array.
        stack.push(new PayloadWalkNode(get(walkNode.payload, index), get(walkNode.node, index), walkNode.fieldMap, newDepth, index));
      }
    } else if (walkNode.payload !== null && typeof walkNode.payload === 'object') {
      const keys = Object.getOwnPropertyNames(walkNode.payload);
      const childMap = walkNode.fieldMap instanceof DynamicField ? walkNode.fieldMap.children : walkNode.fieldMap;
      for (let index = keys.length - 1; index >= 0; index--) {
        const childKey = keys[index];
        stack.push(new PayloadWalkNode(
          get(walkNode.payload, childKey),
          get(walkNode.node, childKey),
          get(childMap, childKey),
          newDepth,
          childKey,
        ));
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
    public readonly parent?: JsonValue,
  ) {}
}

/**
 * Returning true indicates that the walk should STOP.
 */
export type OperationVisitor = (parent: JsonValue | undefined, fields: FieldNode[]) => boolean;

/**
 *
 */
export function walkOperation(document: DocumentNode, result: JsonObject | undefined, visitor: OperationVisitor) {
  const operation = getOperationOrDie(document);
  const fragmentMap = fragmentMapForDocument(document);

  // Perform the walk as a depth-first traversal; and unlike the payload walk,
  // we don't bother tracking the path.
  const stack = [new OperationWalkNode(operation.selectionSet, result)];

  while (stack.length) {
    const { selectionSet, parent } = stack.pop()!;
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

export function get(value: any, key: PathPart) {
  // Remember: arrays are typeof 'object', too.
  return value !== null && typeof value === 'object' ? value[key] : undefined;
}
