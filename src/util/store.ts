// We only depend on graphql for its types; nothing at runtime.
// eslint-disable-next-line import/no-extraneous-dependencies
import { Kind, ValueNode, VariableNode } from 'graphql';
import { InvariantError } from 'ts-invariant';
import { VariableValue } from '@apollo/client/utilities';

// Note: These functions were originally a part of apollo-utilities, but were
// removed 87c7a2bc as they were unused within the apollo-client project.

function defaultValueFromVariable(_node: VariableNode) {
  throw new InvariantError(`Variable nodes are not supported by valueFromNode`);
}

/**
 * Evaluate a ValueNode and yield its value in its natural JS form.
 */
export function valueFromNode(
  node: ValueNode,
  onVariable: VariableValue = defaultValueFromVariable,
): any {
  switch (node.kind) {
    case Kind.VARIABLE:
      return onVariable(node);
    case Kind.NULL:
      return null;
    case Kind.INT:
      return parseInt(node.value);
    case Kind.FLOAT:
      return parseFloat(node.value);
    case Kind.LIST:
      return node.values.map(v => valueFromNode(v, onVariable));
    case Kind.OBJECT: {
      const value: { [key: string]: any } = {};
      for (const field of node.fields) {
        value[field.name.value] = valueFromNode(field.value, onVariable);
      }
      return value;
    }
    case Kind.STRING:
      return node.value;
    case Kind.BOOLEAN:
      return node.value;
    case Kind.ENUM:
      return node.value;
    default: throw new Error(`Unknown node: ${JSON.stringify(node)}`);
  }
}
