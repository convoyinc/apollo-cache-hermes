import { GraphSnapshot } from './GraphSnapshot';
import { OptimisticUpdateQueue } from './OptimisticUpdateQueue';

/**
 * Maintains an immutable, point-in-time view of the cache.
 */
export interface CacheSnapshot {
  /** The base snapshot for this version of the cache. */
  baseline: GraphSnapshot;
  /** The optimistic view of this version of this cache (may be base). */
  optimistic: GraphSnapshot;
  /** Individual optimistic updates for this version. */
  optimisticQueue: OptimisticUpdateQueue;
}
