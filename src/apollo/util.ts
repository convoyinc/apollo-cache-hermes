import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { NodeId, Query, StaticNodeId } from '../schema';
import { getSelectionSetOrDie } from '../util';

/**
 * Builds a query.
 */
export function toQuery(document: DocumentNode, variables?: object, rootId?: NodeId): Query {
  return {
    rootId: rootId || StaticNodeId.QueryRoot,
    selection: getSelectionSetOrDie(document),
    variables,
  };
}
