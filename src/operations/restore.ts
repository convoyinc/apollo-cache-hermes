import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { Serializable } from '../schema';

export function restore(serializedState: Serializable.GraphSnapshot, cacheContext: CacheContext): GraphSnapshot {
  return new GraphSnapshot();
}
