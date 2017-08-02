import { DocumentNode, OperationDefinitionNode, SelectionSetNode } from 'graphql'; // eslint-disable-line

export type QueryOperationNode = OperationDefinitionNode & { operation: 'query' };

/**
 * Extracts the query operation from `document`.
 */
export function getQueryDefinitionOrDie(document: DocumentNode): QueryOperationNode {
  if (document.definitions.length !== 1) {
    throw new Error(`Ambiguous document: Expected a single definition`);
  }
  const definition = document.definitions[0];
  if (definition.kind !== 'OperationDefinition' || definition.operation !== 'query') {
    // TODO: Include the document or source with the error, as data.
    throw new Error(`Expected to find a query within GQL document, but found none`);
  }

  return definition as QueryOperationNode;
}

/**
 * Extracts the selection set from `document`.
 */
export function getSelectionSetOrDie(document: DocumentNode): SelectionSetNode {
  if (document.definitions.length !== 1) {
    throw new Error(`Ambiguous document: Expected a single definition`);
  }
  const definition = document.definitions[0];
  if (!('selectionSet' in definition)) {
    // TODO: Include the document or source with the error, as data.
    throw new Error(`Expected to find a selection set within GQL document, but found none`);
  }

  return (definition as any).selectionSet as SelectionSetNode;
}
