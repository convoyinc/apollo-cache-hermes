import {
  Transaction,
  Cache as CacheInterface,
  ApolloCache,
} from '@apollo/client';

import { CacheContext } from '../context';
import { Cache, MigrationMap } from '../Cache';
import { CacheSnapshot } from '../CacheSnapshot';
import { GraphSnapshot } from '../GraphSnapshot';

import { ApolloQueryable } from './Queryable';
import { ApolloTransaction } from './Transaction';
import { buildRawOperationFromQuery } from './util';

/**
 * Apollo-specific interface to the cache.
 */
export class Hermes extends ApolloQueryable<GraphSnapshot> {
  /** The underlying Hermes cache. */
  protected _queryable: Cache;

  constructor(configuration?: CacheContext.Configuration) {
    super();
    this._queryable = new Cache(configuration);
  }

  // TODO (yuisu): data can be typed better with update of ApolloCache API
  restore(data: any, migrationMap?: MigrationMap, verifyOptions?: CacheInterface.ReadOptions): ApolloCache<GraphSnapshot> {
    const verifyQuery = verifyOptions && buildRawOperationFromQuery(verifyOptions.query, verifyOptions.variables);
    this._queryable.restore(data, migrationMap, verifyQuery);
    return this;
  }

  // TODO (yuisu): return can be typed better with update of ApolloCache API
  extract(optimistic: boolean = false, pruneOptions?: CacheInterface.ReadOptions): any {
    const pruneQuery = pruneOptions && buildRawOperationFromQuery(pruneOptions.query, pruneOptions.variables);
    return this._queryable.extract(optimistic, pruneQuery);
  }

  reset(): Promise<void> {
    return this._queryable.reset();
  }

  removeOptimistic(id: string): void {
    this._queryable.rollback(id);
  }

  performTransaction(transaction: Transaction<GraphSnapshot>): void {
    this._queryable.transaction(t => transaction(new ApolloTransaction(t)));
  }

  recordOptimisticTransaction(transaction: Transaction<GraphSnapshot>, id: string): void {
    this._queryable.transaction(id, t => transaction(new ApolloTransaction(t)));
  }

  watch(options: CacheInterface.WatchOptions): () => void {
    const query = buildRawOperationFromQuery(options.query, options.variables, options.rootId);
    return this._queryable.watch(query, options.callback);
  }

  getCurrentCacheSnapshot(): CacheSnapshot {
    return this._queryable.getSnapshot();
  }
}
