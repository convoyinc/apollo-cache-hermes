import { valueFromNode, FragmentMap } from 'apollo-utilities';
import { // eslint-disable-line import/no-extraneous-dependencies
  DocumentNode,
  OperationDefinitionNode,
  ValueNode,
} from 'graphql';

import { JsonValue } from '../primitive';

import { isObject } from './primitive';

export {
  getOperationDefinitionOrDie as getOperationOrDie,
  variablesInOperation,
  valueFromNode,
  FragmentMap,
} from 'apollo-utilities';

/**
 * Returns the default values of all variables in the operation.
 */
export function variableDefaultsInOperation(operation: OperationDefinitionNode): { [Key: string]: JsonValue } {
  const defaults = {};
  if (operation.variableDefinitions) {
    for (const definition of operation.variableDefinitions) {
      if (definition.type.kind === 'NonNullType') continue; // Required.

      const { defaultValue } = definition;
      defaults[definition.variable.name.value] = isObject(defaultValue) ? valueFromNode(defaultValue as ValueNode) : null;
    }
  }

  return defaults;
}
/**
 * Extracts fragments from `document` by name.
 */
export function fragmentMapForDocument(document: DocumentNode): FragmentMap {
  const map: FragmentMap = {};
  for (const definition of document.definitions) {
    if (definition.kind !== 'FragmentDefinition') continue;
    map[definition.name.value] = definition;
  }

  return map;
}
