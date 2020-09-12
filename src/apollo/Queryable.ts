import { ApolloCache, Cache, DataProxy, makeReference, Reference } from '@apollo/client/core';
import { removeDirectivesFromDocument } from '@apollo/client/utilities';

import { UnsatisfiedCacheError } from '../errors';
import { JsonObject } from '../primitive';
import { Queryable } from '../Queryable';
import { DocumentNode } from '../util';

import { buildRawOperationFromFragment, buildRawOperationFromQuery } from './util';

/**
 * Apollo-specific interface to the cache.
 */
export abstract class ApolloQueryable<TSerialized> extends ApolloCache<TSerialized> {
  /** The underlying Hermes cache. */
  protected abstract _queryable: Queryable;

  diff<T>(options: Cache.DiffOptions): Cache.DiffResult<T | any> {
    const rawOperation = buildRawOperationFromQuery(options.query, options.variables);
    const { result, complete } = this._queryable.read(rawOperation, options.optimistic);
    if (options.returnPartialData === false && !complete) {
      // TODO: Include more detail with this error.
      throw new UnsatisfiedCacheError(`diffQuery not satisfied by the cache.`);
    }

    return { result, complete };
  }

  read(options: Cache.ReadOptions): any {
    const rawOperation = buildRawOperationFromQuery(options.query, options.variables, options.rootId);
    const { result, complete } = this._queryable.read(rawOperation, options.optimistic);
    if (!complete) {
      // TODO: Include more detail with this error.
      throw new UnsatisfiedCacheError(`read not satisfied by the cache.`);
    }

    return result;
  }

  readQuery<QueryType, TVariables = any>(options: DataProxy.Query<TVariables>, optimistic?: true): QueryType {
    return this.read({
      query: options.query,
      variables: options.variables,
      optimistic: !!optimistic,
    });
  }

  readFragment<FragmentType, TVariables = any>(options: DataProxy.Fragment<TVariables>, optimistic?: true): FragmentType | null {
    // TODO: Support nested fragments.
    const rawOperation = buildRawOperationFromFragment(
      options.fragment,
      options.id!,
      options.variables as any,
      options.fragmentName,
    );
    return this._queryable.read(rawOperation, optimistic).result as any;
  }

  write(options: Cache.WriteOptions): Reference | undefined {
    const rawOperation = buildRawOperationFromQuery(options.query, options.variables as JsonObject, options.dataId);
    this._queryable.write(rawOperation, options.result);

    return makeReference(rawOperation.rootId);
  }

  writeQuery<TData = any, TVariables = any>(options: Cache.WriteQueryOptions<TData, TVariables>): Reference | undefined {
    const rawOperation = buildRawOperationFromQuery(options.query, options.variables as any);
    this._queryable.write(rawOperation, options.data as any);

    return makeReference(rawOperation.rootId);
  }

  writeFragment<TData = any, TVariables = any>(options: Cache.WriteFragmentOptions<TData, TVariables>): Reference | undefined {
    // TODO: Support nested fragments.
    const rawOperation = buildRawOperationFromFragment(
      options.fragment,
      options.id!,
      options.variables as any,
      options.fragmentName,
    );
    this._queryable.write(rawOperation, options.data as any);

    return makeReference(rawOperation.rootId);
  }

  transformDocument(doc: DocumentNode): DocumentNode {
    return this._queryable.transformDocument(doc);
  }

  transformForLink(document: DocumentNode): DocumentNode { // eslint-disable-line class-methods-use-this
    // @static directives are for the cache only.
    return removeDirectivesFromDocument(
      [{ name: 'static' }],
      document
    )!;
  }

  evict(_options: Cache.EvictOptions): boolean { // eslint-disable-line class-methods-use-this
    throw new Error(`evict() is not implemented in Hermes`);
  }
}
