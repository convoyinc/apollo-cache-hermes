import gql from 'graphql-tag';

import { JsonObject } from '../../src/primitive';
import { NodeId, RawQuery, StaticNodeId } from '../../src/schema';

/**
 * Constructs a Query from a gql document.
 */
export function query(gqlString: string, variables?: JsonObject, rootId?: NodeId): RawQuery {
  return {
    rootId: rootId || StaticNodeId.QueryRoot,
    document: gql(gqlString),
    variables,
  };
}
