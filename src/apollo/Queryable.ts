import { Cache, DataProxy } from 'apollo-cache';
import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies

import { UnsatisfiedCacheError } from '../errors';
import { JsonObject } from '../primitive';
import { Queryable } from '../Queryable';

import { buildRawOperationFromQuery, buildRawOperationFromFragment } from './util';

/**
 * Apollo-specific interface to the cache.
 */
export abstract class ApolloQueryable implements DataProxy {
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

  readQuery<QueryType>(options: DataProxy.Query, optimistic?: true): QueryType {
    return this.read({
      query: options.query,
      variables: options.variables,
      optimistic: !!optimistic,
    });
  }

  readFragment<FragmentType>(options: DataProxy.Fragment, optimistic?: true): FragmentType | null {
    // TODO: Support nested fragments.
    const rawOperation = buildRawOperationFromFragment(
      options.fragment,
      options.id,
      options.variables as JsonObject,
      options.fragmentName,
    );
    return this._queryable.read(rawOperation, optimistic).result as any;
  }

  write(options: Cache.WriteOptions): void {
    const rawOperation = buildRawOperationFromQuery(options.query, options.variables as JsonObject, options.dataId);
    this._queryable.write(rawOperation, options.result);
  }

  writeQuery(options: Cache.WriteQueryOptions): void {
    const rawOperation = buildRawOperationFromQuery(options.query, options.variables as JsonObject);
    this._queryable.write(rawOperation, options.data);
  }

  writeFragment(options: Cache.WriteFragmentOptions): void {
    // TODO: Support nested fragments.
    const rawOperation = buildRawOperationFromFragment(
      options.fragment,
      options.id,
      options.variables as JsonObject,
      options.fragmentName,
    );
    this._queryable.write(rawOperation, options.data);
  }

  transformDocument(doc: DocumentNode): DocumentNode {
    return this._queryable.transformDocument(doc);
  }

  public transformForLink(document: DocumentNode): DocumentNode { // eslint-disable-line class-methods-use-this
    // TODO: Actually transform it (and/or make it optional upstream).
    return document;
  }

  evict(options: Cache.EvictOptions): Cache.EvictionResult {
    const rawOperation = buildRawOperationFromQuery(options.query, options.variables);
    return this._queryable.evict(rawOperation);
  }
}
