/* eslint-disable class-methods-use-this */
import { ApolloCache, Cache, Transaction } from 'apollo-cache-core';

import { CacheTransaction } from '../CacheTransaction';

import { ApolloQueryable } from './Queryable';

/**
 * Apollo-specific transaction interface.
 */
export class ApolloTransaction extends ApolloQueryable implements ApolloCache {

  constructor(
    /** The underlying transaction. */
    protected _queryable: CacheTransaction,
  ) {
    super();
  }

  getData() {
    throw new Error(`getData() is not allowed within a transaction`);
  }

  getOptimisticData() {
    throw new Error(`getOptimisticData() is not allowed within a transaction`);
  }

  reset(): Promise<void> { // eslint-disable-line class-methods-use-this
    throw new Error(`reset() is not allowed within a transaction`);
  }

  removeOptimistic(id: string): void { // eslint-disable-line class-methods-use-this
    throw new Error(`removeOptimistic() is not allowed within a transaction`);
  }

  performTransaction(transaction: Transaction): void {
    transaction(this);
  }

  recordOptimisticTransaction(transaction: Transaction, id: string): void { // eslint-disable-line class-methods-use-this
    throw new Error(`recordOptimisticTransaction() is not allowed within a transaction`);
  }

  watch(query: Cache.WatchOptions): () => void { // eslint-disable-line class-methods-use-this, max-len
    throw new Error(`watch() is not allowed within a transaction`);
  }

}
