import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { JsonObject } from '../primitive';
import { RawOperation } from '../schema';
import { EditedSnapshot } from './SnapshotEditor';
/**
 * Merges a payload with an existing graph snapshot, generating a new one.
 *
 * Performs the minimal set of edits to generate new immutable versions of each
 * node, while preserving immutability of the parent snapshot.
 */
export declare function write(context: CacheContext, snapshot: GraphSnapshot, raw: RawOperation, payload: JsonObject): EditedSnapshot;
