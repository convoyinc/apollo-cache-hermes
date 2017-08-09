import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { NodeId, Query, StaticNodeId } from '../schema';
import { addTypenameToDocument } from '../util';

/**
 * Builds a query.
 */
export function toQuery(document: DocumentNode, variables?: object, rootId?: NodeId): Query {
  document = addTypenameToDocument(document);
  return {
    rootId: rootId || StaticNodeId.QueryRoot,
    document,
    variables,
  };
}
