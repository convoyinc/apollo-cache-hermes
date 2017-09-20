import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { JsonObject } from '../primitive';
import { NodeId, RawQuery, StaticNodeId } from '../schema';

/**
 * Builds a query.
 */
export function toQuery(document: DocumentNode, variables?: JsonObject, rootId?: NodeId): RawQuery {
  return {
    rootId: rootId || StaticNodeId.QueryRoot,
    document,
    variables,
  };
}
