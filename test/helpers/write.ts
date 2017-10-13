import { CacheContext } from '../../src/context/CacheContext';
import { GraphSnapshot } from '../../src/GraphSnapshot';
import { EditedSnapshot } from '../../src/operations/SnapshotEditor';
import { write } from '../../src/operations/write';
import { JsonObject } from '../../src/primitive';
import { NodeId } from '../../src/schema';

import { strictConfig } from './context';
import { query } from './graphql';

export function createSnapshot(
  payload: JsonObject,
  gqlString: string,
  gqlVariables?: JsonObject,
  rootId?: NodeId,
  cacheConfig: CacheContext.Configuration = strictConfig
): EditedSnapshot {

  return write(
    new CacheContext(cacheConfig),
    new GraphSnapshot(),
    query(gqlString, gqlVariables, rootId),
    payload
  );
}

export function updateSnapshot(
  baseline: GraphSnapshot,
  payload: JsonObject,
  gqlString: string,
  gqlVariables?: JsonObject,
  rootId?: NodeId,
  cacheConfig: CacheContext.Configuration = strictConfig
): EditedSnapshot {

  return write(
    new CacheContext(cacheConfig),
    baseline,
    query(gqlString, gqlVariables, rootId),
    payload
  );
}
