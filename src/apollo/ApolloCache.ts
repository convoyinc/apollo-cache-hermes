import { Cache } from '../Cache';
import { CacheContext } from '../CacheContext';

import { ApolloQueryable } from './ApolloQueryable';
import { ApolloTransaction } from './ApolloTransaction';
import * as interfaces from './interfaces';
import { toQuery } from './util';

/**
 * Apollo-specific interface to the cache.
 */
export class ApolloCache extends ApolloQueryable implements interfaces.Cache {

  /** The underlying Hermes cache. */
  protected _queryable: Cache;

  constructor(configuration?: CacheContext) {
    super();
    this._queryable = new Cache(configuration);
  }

  reset(): Promise<void> {
    return this._queryable.reset();
  }ÍÍ

  removeOptimistic(id: string): void {
    this._queryable.rollback(id);
  }

  performTransaction(transaction: interfaces.Cache.Transaction): void {
    this._queryable.transaction(t => transaction(new ApolloTransaction(t)));
  }

  recordOptimisticTransaction(transaction: interfaces.Cache.Transaction, id: string): void {
    this._queryable.transaction(id, t => transaction(new ApolloTransaction(t)));
  }

  watch(options: interfaces.Cache.WatchOptions, callback: interfaces.Cache.Callback): interfaces.Cache.Callback {
    const query = toQuery(options.query, options.variables, options.rootId);
    return this._queryable.watch(query, callback);
  }

}
