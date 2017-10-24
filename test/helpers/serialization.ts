import { CacheContext } from '../../src/context/CacheContext';
import { GraphSnapshot } from '../../src/GraphSnapshot';
import { JsonObject } from '../../src/primitive';

import { createSnapshot } from './write';

/**
 * Helper for testing extract and restore functions
 */

export function createOriginalGraphSnapshot(
  payload: JsonObject,
  gqlString: string,
  cacheContext: CacheContext,
  gqlVariables?: JsonObject,
): GraphSnapshot {
  return createSnapshot(
    payload,
    gqlString,
    gqlVariables,
    /* rootId */ undefined,
    cacheContext
  ).snapshot;
}
