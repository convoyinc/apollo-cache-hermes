import gql from 'graphql-tag';

import { JsonObject } from '../../src/primitive';
import { NodeId, Query, StaticNodeId } from '../../src/schema';

/**
 * Constructs a Query from a gql document.
 */
export function query(gqlString: string, variables?: JsonObject, rootId?: NodeId): Query {
  return {
    rootId: rootId || StaticNodeId.QueryRoot,
    document: gql(gqlString),
    variables,
  };
}
