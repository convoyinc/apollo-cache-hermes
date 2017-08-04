import { CacheTransaction } from '../CacheTransaction';

import { ApolloQueryable } from './ApolloQueryable';
import * as interfaces from './interfaces';

/**
 * Apollo-specific transaction interface.
 */
export class ApolloTransaction extends ApolloQueryable implements interfaces.Cache {

  constructor(
    /** The underlying transaction. */
    protected _queryable: CacheTransaction,
  ) {
    super();
  }

  reset(): Promise<void> { // eslint-disable-line class-methods-use-this
    throw new Error(`reset() is not allowed within a transaction`);
  }

  removeOptimistic(id: string): void { // eslint-disable-line class-methods-use-this
    throw new Error(`removeOptimistic() is not allowed within a transaction`);
  }

  performTransaction(transaction: interfaces.Cache.Transaction): void { // eslint-disable-line class-methods-use-this
    throw new Error(`performTransaction() is not allowed within a transaction`);
  }

  recordOptimisticTransaction(transaction: interfaces.Cache.Transaction, id: string): void { // eslint-disable-line class-methods-use-this
    throw new Error(`recordOptimisticTransaction() is not allowed within a transaction`);
  }

  watch(query: interfaces.Cache.WatchOptions, callback: interfaces.Cache.Callback): interfaces.Cache.Callback { // eslint-disable-line class-methods-use-this, max-len
    throw new Error(`watch() is not allowed within a transaction`);
  }

}
