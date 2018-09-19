import { CacheContext } from '../../src/context/CacheContext';
import { GraphSnapshot } from '../../src/GraphSnapshot';
import { JsonObject } from '../../src/primitive';
import { NodeId } from '../../src/schema';
/**
 * Helper for creating graphSnapshot used by
 * extract or restore function.
 */
export declare function createGraphSnapshot(payload: JsonObject, gqlString: string, cacheContext: CacheContext, gqlVariables?: JsonObject, rootId?: NodeId): GraphSnapshot;
