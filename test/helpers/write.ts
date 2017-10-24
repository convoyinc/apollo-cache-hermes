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
  cacheContext: CacheContext = new CacheContext(strictConfig)
): EditedSnapshot {

  const rawOperation = query(gqlString, gqlVariables, rootId);

  return write(
    cacheContext,
    new GraphSnapshot(),
    { ...rawOperation, document: cacheContext.transformDocument(rawOperation.document) },
    payload
  );
}

export function updateSnapshot(
  baseline: GraphSnapshot,
  payload: JsonObject,
  gqlString: string,
  gqlVariables?: JsonObject,
  rootId?: NodeId,
  cacheContext: CacheContext = new CacheContext(strictConfig)
): EditedSnapshot {

  const rawOperation = query(gqlString, gqlVariables, rootId);

  return write(
    cacheContext,
    baseline,
    { ...rawOperation, document: cacheContext.transformDocument(rawOperation.document) },
    payload
  );
}
