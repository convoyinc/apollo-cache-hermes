import { CacheContext } from '../../src/context/CacheContext';
import { GraphSnapshot } from '../../src/GraphSnapshot';
import { EditedSnapshot } from '../../src/operations/SnapshotEditor';
import { JsonObject } from '../../src/primitive';
import { NodeId } from '../../src/schema';
export declare function createSnapshot(payload: JsonObject, gqlString: string, gqlVariables?: JsonObject, rootId?: NodeId, cacheContext?: CacheContext): EditedSnapshot;
export declare function updateSnapshot(baseline: GraphSnapshot, payload: JsonObject, gqlString: string, gqlVariables?: JsonObject, rootId?: NodeId, cacheContext?: CacheContext): EditedSnapshot;
