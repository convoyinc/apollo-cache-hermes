import { GraphSnapshot } from './GraphSnapshot';
import { OptimisticUpdateQueue } from './OptimisticUpdateQueue';

/**
 * Maintains an immutable, point-in-time view of the cache.
 *
 * We make CacheSnapshot a class instead of an interface because
 * to garuntee consistentcy of properties and their order. This
 * improves performance as JavaScript VM can do better optimization.
 */
export class CacheSnapshot {
  constructor(
    /** The base snapshot for this version of the cache. */
    public baseline: GraphSnapshot,
    /** The optimistic view of this version of this cache (may be base). */
    public optimistic: GraphSnapshot,
    /** Individual optimistic updates for this version. */
    public optimisticQueue: OptimisticUpdateQueue,
  ) {}
}
