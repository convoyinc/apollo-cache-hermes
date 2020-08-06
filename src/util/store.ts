// We only depend on graphql for its types; nothing at runtime.
// eslint-disable-next-line import/no-extraneous-dependencies
import { ValueNode, VariableNode } from 'graphql';
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
    case 'Variable':
      return onVariable(node);
    case 'NullValue':
      return null;
    case 'IntValue':
      return parseInt(node.value);
    case 'FloatValue':
      return parseFloat(node.value);
    case 'ListValue':
      return node.values.map(v => valueFromNode(v, onVariable));
    case 'ObjectValue': {
      const value: { [key: string]: any } = {};
      for (const field of node.fields) {
        value[field.name.value] = valueFromNode(field.value, onVariable);
      }
      return value;
    }
    default:
      return node.value;
  }
}
