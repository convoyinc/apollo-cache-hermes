import { ParsedQueryWithVariables } from '../ParsedQueryNode';
import { JsonObject, JsonValue, PathPart } from '../primitive';

class OperationWalkNode {
  constructor(
    public readonly parsedOperation: ParsedQueryWithVariables,
    public readonly path: (string | number)[],
    public readonly parent?: JsonValue,
  ) {}
}

/**
 * Returning true indicates that the walk should STOP.
 */
export type OperationVisitor = (parent: JsonValue | undefined, fields: string[], path: (string | number)[]) => boolean;

/**
 * Walk and run on ParsedQueryNode and the result.
 * This is used to verify result of the read operation.
 */
export function walkOperation(rootOperation: ParsedQueryWithVariables, result: JsonObject | undefined, visitor: OperationVisitor) {

  // Perform the walk as a depth-first traversal; and unlike the payload walk,
  // we don't bother tracking the path.
  const queue = [new OperationWalkNode(rootOperation, [], result)];

  for (let q = 0; q < queue.length; q++) {
    const { parsedOperation, parent, path } = queue[q]!;
    // We consider null nodes to be skippable (and satisfy the walk).
    if (parent === null) continue;

    // Fan-out for arrays.
    if (Array.isArray(parent)) {
      for (let i = 0, l = parent.length; i < l; i++) {
        queue.push(new OperationWalkNode(parsedOperation, [...path, i], parent[i]));
      }
      continue;
    }

    const fields: string[] = [];
    // TODO: Directives?
    for (const fieldName in parsedOperation) {
      fields.push(fieldName);
      const nextParsedQuery = parsedOperation[fieldName].children;
      if (nextParsedQuery) {
        queue.push(new OperationWalkNode(nextParsedQuery, [...path, fieldName], get(parent, fieldName)));
      }
    }

    if (fields.length) {
      const shouldStop = visitor(parent, fields, path);
      if (shouldStop) return;
    }
  }
}

export function get(value: any, key: PathPart) {
  // Remember: arrays are typeof 'object', too.
  return value !== null && typeof value === 'object' ? value[key] : undefined;
}
