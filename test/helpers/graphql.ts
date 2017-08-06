import gql from 'graphql-tag';

import { NodeId, Query, StaticNodeId } from '../../src/schema';
import { getSelectionSetOrDie } from '../../src/util/ast';

/**
 * Constructs a Query from a gql document.
 */
export function query(gqlString: string, variables?: object, rootId?: NodeId): Query {
  return {
    rootId: rootId || StaticNodeId.QueryRoot,
    selection: getSelectionSetOrDie(gql(gqlString)),
    variables,
  };
}
