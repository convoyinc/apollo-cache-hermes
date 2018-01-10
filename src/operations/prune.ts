import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { JsonObject } from '../primitive';
import { RawOperation } from '../schema';

import { read } from './read';
import { write } from './write';

/**
 * Return a new graph snapshot pruned to just the shape of the given query
 */
export function prune(context: CacheContext, snapshot: GraphSnapshot, raw: RawOperation) {
  const queryResult = read(context, raw, snapshot);
  const pruned = write(
    context,
    new GraphSnapshot(),
    raw,
    queryResult.result && queryResult.complete ? queryResult.result : {} as JsonObject
  );
  return {
    snapshot: pruned.snapshot,
    complete: queryResult.complete,
  };
}
