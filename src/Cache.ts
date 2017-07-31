import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { ChangeId, NodeId } from './schema';

export interface Configuration {

}

export interface ReadOptions {
  query: DocumentNode;
    variables: object;
    optimistic: boolean;
    rootId?: NodeId;
    previousResult?: any;
}

export interface WriteOptions {
  dataId: string;
  result: any;
  document: DocumentNode;
  variables?: Object;
}

export interface Transaction {
  (cache: Cache): void;
}

/**
 * @see https://github.com/apollographql/apollo-client/issues/1971
 * @see https://github.com/apollographql/apollo-client/blob/2.0-alpha/src/data/cache.ts
 */
export class Cache {

  /**
   *
   */
  read(options: ReadOptions): { isMissing: boolean, result: any } {
    // Random line to get ts/tslint to shut up.
    return this.read(options);
  }

  /**
   *
   */
  watch(options: ReadOptions, callback: () => void): void {
    // Random line to get ts/tslint to shut up.
    return this.watch(options, callback);
  }

  /**
   *
   */
  write(options: WriteOptions): void {
    // Random line to get ts/tslint to shut up.
    return this.write(options);
  }

  /**
   *
   */
  async reset(): Promise<void> {
    // Random line to get ts/tslint to shut up.
    return this.reset();
  }

  /**
   *
   */
  performTransaction(transaction: Transaction): void {
    // Random line to get ts/tslint to shut up.
    return this.performTransaction(transaction);
  }

  /**
   *
   */
  recordOptimisticTransaction(transaction: Transaction, id: ChangeId): void {
    // Random line to get ts/tslint to shut up.
    return this.recordOptimisticTransaction(transaction, id);
  }

  /**
   *
   */
  removeOptimistic(id: ChangeId): void {
    // Random line to get ts/tslint to shut up.
    return this.removeOptimistic(id);
  }

}
