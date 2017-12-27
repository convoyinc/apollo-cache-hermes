import { ParsedQueryWithVariables } from '../ParsedQueryNode';
import { JsonObject, JsonValue, PathPart } from '../primitive';

class OperationWalkNode {
  constructor(
    public readonly parsedOperation: ParsedQueryWithVariables,
    public readonly parent?: JsonValue,
  ) {}
}

/**
 * Returning true indicates that the walk should STOP.
 */
export type OperationVisitor = (parent: JsonValue | undefined, fields: string[]) => boolean;

/**
 * Walk and run on ParsedQueryNode and the result.
 * This is used to verify result of the read operation.
 */
export function walkOperation(rootOperation: ParsedQueryWithVariables, result: JsonObject | undefined, visitor: OperationVisitor) {

  // Perform the walk as a depth-first traversal; and unlike the payload walk,
  // we don't bother tracking the path.
  const stack = [new OperationWalkNode(rootOperation, result)];

  while (stack.length) {
    const { parsedOperation, parent } = stack.pop()!;
    // We consider null nodes to be skippable (and satisfy the walk).
    if (parent === null) continue;

    // Fan-out for arrays.
    if (Array.isArray(parent)) {
      // Push in reverse purely for ergonomics: they'll be pulled off in order.
      for (let i = parent.length - 1; i >= 0; i--) {
        stack.push(new OperationWalkNode(parsedOperation, parent[i]));
      }
      continue;
    }

    const fields: string[] = [];
    // TODO: Directives?
    for (const fieldName in parsedOperation) {
      fields.push(fieldName);
      const nextParsedQuery = parsedOperation[fieldName].children;
      if (nextParsedQuery) {
        stack.push(new OperationWalkNode(nextParsedQuery, get(parent, fieldName)));
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
