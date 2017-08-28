import lodashCloneDeep = require('lodash.clonedeep');
import { // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
  DocumentNode,
  DefinitionNode,
  FieldNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  SelectionSetNode,
} from 'graphql';

import { JsonValue } from '../primitive';

/**
 * Extracts the query operation from `document`.
 */
export function getOperationOrDie(document: DocumentNode): OperationDefinitionNode {
  const operations = document.definitions.filter(d => d.kind === 'OperationDefinition') as OperationDefinitionNode[];
  if (!operations.length) {
    throw new Error(`GraphQL document is missing am operation`);
  }
  if (operations.length > 1) {
    throw new Error(`Ambiguous GraphQL document: contains ${operations.length} operations`);
  }

  return operations[0];
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
      defaults[definition.variable.name.value] = definition.defaultValue;
    }
  }

  return defaults;
}


export interface FragmentMap {
  [Key: string]: FragmentDefinitionNode;
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

// The following are borrowed directly from apollo-client:

const TYPENAME_FIELD: FieldNode = {
  kind: 'Field',
  name: {
    kind: 'Name',
    value: '__typename',
  },
};

function addTypenameToSelectionSet(selectionSet: SelectionSetNode, isRoot = false) {
  if (selectionSet.selections) {
    if (!isRoot) {
      const alreadyHasThisField = selectionSet.selections.some((selection) => {
        return selection.kind === 'Field' && selection.name.value === '__typename';
      });

      if (!alreadyHasThisField) {
        selectionSet.selections.push(TYPENAME_FIELD);
      }
    }

    selectionSet.selections.forEach((selection) => {
      // Must not add __typename if we're inside an introspection query
      if (selection.kind === 'Field') {
        if (
          selection.name.value.lastIndexOf('__', 0) !== 0 &&
          selection.selectionSet
        ) {
          addTypenameToSelectionSet(selection.selectionSet);
        }
      } else if (selection.kind === 'InlineFragment') {
        if (selection.selectionSet) {
          addTypenameToSelectionSet(selection.selectionSet);
        }
      }
    });
  }
}

export function addTypenameToDocument(doc: DocumentNode) {
  const docClone = lodashCloneDeep(doc);

  docClone.definitions.forEach((definition: DefinitionNode) => {
    addTypenameToSelectionSet(
      (definition as OperationDefinitionNode).selectionSet,
      /* isRoot */ definition.kind === 'OperationDefinition',
    );
  });

  return docClone;
}
