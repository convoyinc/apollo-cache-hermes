import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { JsonObject } from '../primitive';
import { RawOperation } from '../schema';

import { read } from './read';
import { EditedSnapshot } from './SnapshotEditor';
import { write } from './write';

/**
 * Return a new graph snapshot pruned to just the shape of the given query
 */
export function prune(context: CacheContext, snapshot: GraphSnapshot, raw: RawOperation): EditedSnapshot {
  const queryResult = read(context, raw, snapshot);
  return write(
    context,
    new GraphSnapshot(),
    raw,
    queryResult.result && queryResult.complete ? queryResult.result : {} as JsonObject
  );
}
