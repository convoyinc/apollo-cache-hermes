/**
 * @fileoverview
 *
 * Apollo Client's Cache interface, extracted so we can avoid a circular
 * dependency, and adapted so that there is no base class to extend.
 *
 * https://github.com/apollographql/apollo-client/blob/522ed41f74dfca17e6add6167409974d42e105a2/packages/apollo-client/src/data/proxy.ts
 */
import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { DataProxy } from './DataProxy';

export namespace Cache {

  export interface DiffQueryOptions {
    query: DocumentNode;
    variables: any;
    returnPartialData?: boolean;
    previousResult?: any;
    optimistic: boolean;
  }

  export interface DiffResult {
    result?: any;
    isMissing: boolean;
  }

  export interface ReadOptions {
    query: DocumentNode;
    variables: any;
    rootId?: string;
    previousResult?: any;
    optimistic: boolean;
  }

  export import ReadQueryOptions = DataProxy.ReadQueryOptions;

  export import ReadFragmentOptions = DataProxy.ReadFragmentOptions;

  export interface WriteResultOptions {
    dataId: string;
    result: any;
    document: DocumentNode;
    variables?: Object;
  }

  export import WriteQueryOptions = DataProxy.WriteQueryOptions;

  export import WriteFragmentOptions = DataProxy.WriteFragmentOptions;

  export interface WatchOptions {
    query: DocumentNode;
    variables: any;
    rootId?: string;
    previousResult?: any;
    optimistic: boolean;
  }

  export type Transaction = (c: Cache) => void;

  export type Callback = () => void;

}

export interface Cache extends DataProxy {

  reset(): Promise<void>;

  diffQuery(query: Cache.DiffQueryOptions): Cache.DiffResult;

  read(query: Cache.ReadOptions): any;

  readQuery<QueryType>(options: Cache.ReadQueryOptions, optimistic?: true): QueryType;

  readFragment<FragmentType>(options: Cache.ReadFragmentOptions, optimistic?: true): FragmentType | null;

  writeResult(write: Cache.WriteResultOptions): void;

  writeQuery(options: Cache.WriteQueryOptions): void;

  writeFragment(options: Cache.WriteFragmentOptions): void;

  removeOptimistic(id: string): void;

  performTransaction(transaction: Cache.Transaction): void;

  recordOptimisticTransaction(transaction: Cache.Transaction, id: string): void;

  watch(query: Cache.WatchOptions, callback: Cache.Callback): Cache.Callback;

}
