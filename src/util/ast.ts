// We only depend on graphql for its types; nothing at runtime.
import type {
  ArgumentNode,
  DocumentNode,
  FieldNode,
  OperationDefinitionNode,
  OperationTypeNode,
  SelectionNode,
  SelectionSetNode,
  ValueNode,
} from 'graphql';
import { getOperationDefinition, FragmentMap } from '@apollo/client/utilities';
import invariant from 'ts-invariant';

import { JsonValue } from '../primitive';

import { isObject } from './primitive';
import { valueFromNode } from './store';

// AST types for convenience.
export {
  ArgumentNode,
  DocumentNode,
  OperationDefinitionNode,
  OperationTypeNode,
  SelectionNode,
  SelectionSetNode,
  ValueNode,
  FragmentMap,
};

export function getOperationOrDie(
  document: DocumentNode,
): OperationDefinitionNode {
  const def = getOperationDefinition(document);
  invariant(def, `GraphQL document is missing an operation`);
  return def as OperationDefinitionNode;
}

/**
 * Returns the names of all variables declared by the operation.
 */
export function variablesInOperation(operation: OperationDefinitionNode): Set<string> {
  const names = new Set<string>();
  if (operation.variableDefinitions) {
    for (const definition of operation.variableDefinitions) {
      names.add(definition.variable.name.value);
    }
  }

  return names;
}

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

/**
 * Returns whether a selection set is considered static from the cache's
 * perspective.
 *
 * This is helpful if you want to assert that certain fragments or queries stay
 * static within the cache (and thus, avoid read-time overhead).
 *
 * If the selectionSet contains fragments, you must provide a getter function
 * that exposes them.
 */
export function selectionSetIsStatic(
  selectionSet: SelectionSetNode,
  fragmentGetter?: (name: string) => SelectionSetNode | undefined,
): boolean {
  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field') {
      if (!fieldIsStatic(selection)) return false;
      if (selection.selectionSet && !selectionSetIsStatic(selection.selectionSet, fragmentGetter)) return false;

    } else if (selection.kind === 'FragmentSpread') {
      if (!fragmentGetter) {
        throw new Error(`fragmentGetter is required for selection sets with ...fragments`);
      }
      const fragmentSet = fragmentGetter(selection.name.value);
      if (!fragmentSet) {
        throw new Error(`Unknown fragment ${selection.name.value} in isSelectionSetStatic`);
      }

      if (!selectionSetIsStatic(fragmentSet, fragmentGetter)) return false;

    } else if (selection.kind === 'InlineFragment') {
      if (!selectionSetIsStatic(selection.selectionSet, fragmentGetter)) return false;

    } else {
      throw new Error(`Unknown selection type ${(selection as any).kind} in isSelectionSetStatic`);
    }
  }

  return true;
}

export function fieldIsStatic(field: FieldNode) {
  const isActuallyStatic = !fieldHasAlias(field) && !fieldIsParameterized(field);
  return isActuallyStatic || fieldHasStaticDirective(field);
}

export function fieldHasAlias(field: FieldNode) {
  return !!field.alias;
}

export function fieldIsParameterized(field: FieldNode) {
  return !!(field.arguments && field.arguments.length);
}

export function fieldHasStaticDirective({ directives }: FieldNode) {
  if (!directives) return false;
  return directives.some(directive => directive.name.value === 'static');
}
