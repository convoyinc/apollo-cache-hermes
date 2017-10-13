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
  const context = new CacheContext(cacheConfig);
  const empty = new GraphSnapshot();

  return write(context, empty, query(gqlString, gqlVariables, rootId), payload);
}

export function createUpdateEditedSnapshot(
  baseline: GraphSnapshot,
  { gqlString, gqlVariables, rootId }: QueryObject,
  payload: JsonObject,
  cacheConfig: CacheContext.Configuration = strictConfig
): EditedSnapshot {
  const context = new CacheContext(cacheConfig);

  return write(context, baseline, query(gqlString, gqlVariables, rootId), payload);
}
