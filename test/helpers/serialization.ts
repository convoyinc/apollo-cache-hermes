import { CacheContext } from '../../src/context/CacheContext';
import { GraphSnapshot } from '../../src/GraphSnapshot';
import { JsonObject } from '../../src/primitive';

import { strictCacheContext } from './context';
import { createSnapshot } from './write';

/**
 * Helper for testing extract and restore functions
 */

export function createOriginalGraphSnapshot(
  payload: JsonObject,
  gqlString: string,
  cacheContext: CacheContext = strictCacheContext
): GraphSnapshot {
  return createSnapshot(
    payload,
    gqlString,
    /* gqlVariables */ undefined,
    /* rootId */ undefined,
    cacheContext
  ).snapshot;
}

export function createParameterizedOriginalGraphSnapshot(
  payload: JsonObject,
  gqlString: string,
  gqlVariables: JsonObject,
  cacheContext: CacheContext = strictCacheContext
): GraphSnapshot {
  return createSnapshot(
    payload,
    gqlString,
    gqlVariables,
    /* rootId */ undefined,
    cacheContext
  ).snapshot;
}
