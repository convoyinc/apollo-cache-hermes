import { ApolloCache, Cache, Reference, makeReference } from '@apollo/client';
import { removeDirectivesFromDocument } from '@apollo/client/utilities';

import { UnsatisfiedCacheError } from '../errors';
import { JsonObject } from '../primitive';
import { Queryable } from '../Queryable';
import { DocumentNode } from '../util';

import { buildRawOperationFromQuery, buildRawOperationFromFragment } from './util';

/**
 * Apollo-specific interface to the cache.
 */
export abstract class ApolloQueryable<TSerialized> extends ApolloCache<TSerialized> {
  /** The underlying Hermes cache. */
  protected abstract _queryable: Queryable;

  diff<T>(options: Cache.DiffOptions): Cache.DiffResult<T | any> {
    const rawOperation = buildRawOperationFromQuery(options.query, options.variables);
    const { result, complete, missing, fromOptimisticTransaction } = this._queryable.read(rawOperation, options.optimistic);
    if (options.returnPartialData === false && !complete) {
      // TODO: Include more detail with this error.
      throw new UnsatisfiedCacheError(`diffQuery not satisfied by the cache.`);
    }

    return { result, complete, missing, fromOptimisticTransaction };
  }

  read(options: Cache.ReadOptions): any {
    const rawOperation = buildRawOperationFromQuery(options.query, options.variables, options.rootId);
    const { result, complete } = this._queryable.read(rawOperation, options.optimistic);
    if (complete || options.returnPartialData) {
      return result;
    }
    return null;
  }

  readQuery<QueryType, TVariables = any>(options: Cache.ReadQueryOptions<QueryType, TVariables>, optimistic?: true): QueryType {
    return this.read({
      query: options.query,
      variables: options.variables,
      optimistic: !!optimistic,
      returnPartialData: options.returnPartialData,
      rootId: options.id,
    });
  }

  readFragment<FragmentType, TVariables = any>(options: Cache.ReadFragmentOptions<FragmentType, TVariables>, optimistic?: boolean):
    FragmentType | null {
    // TODO: Support nested fragments.
    const rawOperation = buildRawOperationFromFragment(
      options.fragment,
      options.id!,
      options.variables as any,
      options.fragmentName,
    );
    const { complete, result } = this._queryable.read(rawOperation, optimistic);
    if (complete || options.returnPartialData) {
      return result ?? null as any;
    }
    return null;
  }

  modify<Entity extends Record<string, any> = Record<string, any>>(options: Cache.ModifyOptions<Entity>): boolean {
    return this._queryable.modify(options);
  }

  write(options: Cache.WriteOptions): Reference | undefined {
    const rawOperation = buildRawOperationFromQuery(options.query, options.variables as JsonObject, options.dataId);
    this._queryable.write(rawOperation, options.result, options.broadcast);

    return makeReference(rawOperation.rootId);
  }

  writeQuery<TData = any, TVariables = any>(options: Cache.WriteQueryOptions<TData, TVariables>): Reference | undefined {
    const rawOperation = buildRawOperationFromQuery(options.query, options.variables as any, options.id);
    this._queryable.write(rawOperation, options.data as any, options.broadcast);

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
    this._queryable.write(rawOperation, options.data as any, options.broadcast);

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

  evict(options: Cache.EvictOptions): boolean {
    return this._queryable.evict(options);
  }
}
