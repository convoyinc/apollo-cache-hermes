import { // eslint-disable-line import/no-extraneous-dependencies
  DocumentNode,
  FieldNode,
  SelectionSetNode,
} from 'graphql';

import { JsonObject, JsonValue, PathPart } from '../primitive';

import { fragmentMapForDocument, getOperationOrDie } from './ast';

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
          const nameNode = selection.alias || selection.name;
          const child = get(parent, nameNode.value);
          stack.push(new OperationWalkNode(selection.selectionSet, child));
        }

      // Fragments are applied to the current value.
      } else if (selection.kind === 'FragmentSpread') {
        const fragment = fragmentMap[selection.name.value];
        if (!fragment) {
          throw new Error(`Expected fragment ${selection.name.value} to be defined`);
        }
        stack.push(new OperationWalkNode(fragment.selectionSet, parent));

      } else if (selection.kind === 'InlineFragment') {
        stack.push(new OperationWalkNode(selection.selectionSet, parent));

      } else {
        throw new Error(`Unsupported GraphQL AST Node ${(selection as any).kind}`);

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
