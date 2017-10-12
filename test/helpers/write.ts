import { CacheContext } from '../../src/context/CacheContext';
import { GraphSnapshot } from '../../src/GraphSnapshot';
import { EditedSnapshot } from '../../src/operations/SnapshotEditor';
import { write } from '../../src/operations/write';
import { JsonObject } from '../../src/primitive';
import { NodeId } from '../../src/schema';

import { strictConfig } from './context';
import { query } from './graphql';

export type QueryObject = {
  gqlString: string,
  gqlVariables?: JsonObject,
  rootId?: NodeId,
};

export function createBaselineEditedSnapshot(
  { gqlString, gqlVariables, rootId }: QueryObject,
  payload: JsonObject,
  cacheConfig: CacheContext.Configuration = strictConfig
): EditedSnapshot {
  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  return write(context, empty, query(gqlString, gqlVariables, rootId), payload);
}

export function createUpdateEditedSnapshot(
  baseline: GraphSnapshot,
  { gqlString, gqlVariables, rootId }: QueryObject,
  payload: JsonObject,
  cacheConfig: CacheContext.Configuration = strictConfig
): EditedSnapshot {
  const context = new CacheContext(strictConfig);

  return write(context, baseline, query(gqlString, gqlVariables, rootId), payload);
}

// List of basic common queries used in unit/write
export namespace WriteTestQuery {
  /**
   * {
   *   viewer { id name }
   * }
   */
  export const basicViewerRefQuery: QueryObject = {
    gqlString: `{ viewer { id name } }`,
  };

  /**
   * {
   *   viewer { postal name }
   * }
   */
  export const basicViewerValueQuery: QueryObject = {
    gqlString: `{ viewer { postal name } }`,
  };

  /**
   * { foo bar }
   */
  export const fooBarLeafValuesQuery: QueryObject = {
    gqlString: `{ foo bar }`,
  };
}
