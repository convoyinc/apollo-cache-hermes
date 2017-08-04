import { Cache } from '../Cache';

import { ApolloQueryable } from './ApolloQueryable';
import { ApolloTransaction } from './ApolloTransaction';
import * as interfaces from './interfaces';
import { toQuery } from './util';

/**
 * Apollo-specific interface to the cache.
 */
export class ApolloCache extends ApolloQueryable implements interfaces.Cache {

  /** The underlying Hermes cache. */
  protected _queryable = new Cache();

  reset(): Promise<void> {
    return this._queryable.reset();
  }

  removeOptimistic(id: string): void {
    // TODO: Complete Me
    return this.removeOptimistic(id);
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
