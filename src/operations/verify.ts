import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { RawOperation } from '../schema';

import { read } from './read';

/**
 * Verify if a query can be satified by the given graph snapshot.
 */
export function verify(context: CacheContext, raw: RawOperation, snapshot: GraphSnapshot): boolean {
  const queryResult = read(context, raw, snapshot);
  return queryResult.complete;
}
