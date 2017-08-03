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

export interface Cache extends DataProxy {

  reset(): Promise<void>;

  diffQuery(query: {
    query: DocumentNode;
    variables: any;
    returnPartialData?: boolean;
    previousResult?: any;
    optimistic: boolean;
  }): any;

  read(query: {
    query: DocumentNode;
    variables: any;
    rootId?: string;
    previousResult?: any;
    optimistic: boolean;
  }): any;

  readQuery<QueryType>(
    options: DataProxy.ReadQueryOptions,
    optimistic?: true,
  ): QueryType;

  readFragment<FragmentType>(
    options: DataProxy.ReadFragmentOptions,
    optimistic?: true,
  ): FragmentType | null;

  writeResult(write: {
    dataId: string;
    result: any;
    document: DocumentNode;
    variables?: Object;
  }): void;

  removeOptimistic(id: string): void;

  performTransaction(transaction: (c: Cache) => void): void;

  recordOptimisticTransaction(
    transaction: (c: Cache) => void,
    id: string,
  ): void;

  watch(
    query: {
      query: DocumentNode;
      variables: any;
      rootId?: string;
      previousResult?: any;
      optimistic: boolean;
    },
    callback: () => void,
  ): () => void;
}
