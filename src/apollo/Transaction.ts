import { ApolloCache, Cache, Transaction } from 'apollo-cache';

import { CacheTransaction } from '../CacheTransaction';
import { GraphSnapshot } from '../GraphSnapshot';

import { ApolloQueryable } from './Queryable';

/**
 * Apollo-specific transaction interface.
 */
export class ApolloTransaction extends ApolloQueryable implements ApolloCache<GraphSnapshot> {

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

  performTransaction(transaction: Transaction<GraphSnapshot>): void {
    transaction(this);
  }

  recordOptimisticTransaction(transaction: Transaction<GraphSnapshot>, id: string): void { // eslint-disable-line class-methods-use-this
    throw new Error(`recordOptimisticTransaction() is not allowed within a transaction`);
  }

  watch(query: Cache.WatchOptions): () => void { // eslint-disable-line class-methods-use-this
    throw new Error(`watch() is not allowed within a transaction`);
  }

  restore(): any { // eslint-disable-line class-methods-use-this
    throw new Error(`restore() is not allowed within a transaction`);
  }

  extract(): any { // eslint-disable-line class-methods-use-this
    throw new Error(`extract() is not allowed within a transaction`);
  }

}
