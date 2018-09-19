import { Transaction, Cache as CacheInterface, ApolloCache } from 'apollo-cache';
import { Cache, MigrationMap } from '../Cache';
import { CacheSnapshot } from '../CacheSnapshot';
import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { ApolloQueryable } from './Queryable';
/**
 * Apollo-specific interface to the cache.
 */
export declare class Hermes extends ApolloQueryable implements ApolloCache<GraphSnapshot> {
    /** The underlying Hermes cache. */
    protected _queryable: Cache;
    constructor(configuration?: CacheContext.Configuration);
    restore(data: any, migrationMap?: MigrationMap, verifyOptions?: CacheInterface.ReadOptions): ApolloCache<GraphSnapshot>;
    extract(optimistic?: boolean, pruneOptions?: CacheInterface.ReadOptions): any;
    reset(): Promise<void>;
    removeOptimistic(id: string): void;
    performTransaction(transaction: Transaction<GraphSnapshot>): void;
    recordOptimisticTransaction(transaction: Transaction<GraphSnapshot>, id: string): void;
    watch(options: CacheInterface.WatchOptions): () => void;
    getCurrentCacheSnapshot(): CacheSnapshot;
}
