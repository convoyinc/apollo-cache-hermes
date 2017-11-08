import {
  Transaction,
  Cache as CacheInterface,
  ApolloCache,
} from 'apollo-cache';

import { Cache } from '../Cache';
import { CacheSnapshot } from '../CacheSnapshot';
import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';

import { ApolloQueryable } from './Queryable';
import { ApolloTransaction } from './Transaction';
import { toQuery } from './util';

/**
 * Apollo-specific interface to the cache.
 */
export class Hermes extends ApolloQueryable implements ApolloCache<GraphSnapshot> {
  /** The underlying Hermes cache. */
  protected _queryable: Cache;

  constructor(configuration?: CacheContext) {
    super();
    this._queryable = new Cache(configuration);
  }

  restore(data: GraphSnapshot): ApolloCache<GraphSnapshot> {
    this._queryable.restore(data);
    return this;
  }

  extract(optimistic: boolean = false): GraphSnapshot {
    if (optimistic) return this._queryable.getSnapshot().optimistic;
    return this._queryable.getSnapshot().baseline;
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
    const query = toQuery(options.query, options.variables, options.rootId);
    return this._queryable.watch(query, options.callback);
  }

  getCurrentCacheSnapshot(): CacheSnapshot {
    return this._queryable.getSnapshot();
  }
}
