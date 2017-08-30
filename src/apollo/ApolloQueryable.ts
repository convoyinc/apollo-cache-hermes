import { JsonObject } from '../primitive';
import { Queryable } from '../Queryable';

import * as interfaces from './interfaces';
import { toQuery } from './util';

/**
 * Apollo-specific interface to the cache.
 */
export abstract class ApolloQueryable {
  /** The underlying Hermes cache. */
  protected abstract _queryable: Queryable;

  diffQuery(options: interfaces.Cache.DiffQueryOptions): interfaces.Cache.DiffResult {
    const query = toQuery(options.query, options.variables);
    const { result, complete } = this._queryable.read(query, options.optimistic);
    if (options.returnPartialData === false && !complete) {
      // TODO: Include more detail with this error.
      throw new Error(`diffQuery not satisfied by the cache.`);
    }

    return { result, isMissing: !complete };
  }

  read(options: interfaces.Cache.ReadOptions): any {
    const query = toQuery(options.query, options.variables, options.rootId);
    const { result, complete } = this._queryable.read(query, options.optimistic);
    if (!complete) {
      // TODO: Include more detail with this error.
      throw new Error(`read not satisfied by the cache.`);
    }

    return result;
  }

  readQuery<QueryType>(options: interfaces.Cache.ReadQueryOptions, optimistic?: true): QueryType {
    return this.read({
      query: options.query,
      variables: options.variables,
      optimistic: !!optimistic,
    });
  }

  readFragment<FragmentType>(options: interfaces.Cache.ReadFragmentOptions, optimistic?: true): FragmentType | null {
    // TODO: Support nested fragments.
    const query = toQuery(options.fragment, options.variables as JsonObject);
    return this._queryable.read(query, optimistic).result as any;
  }

  writeResult(options: interfaces.Cache.WriteResultOptions): void {
    const query = toQuery(options.document, options.variables as JsonObject, options.dataId);
    this._queryable.write(query, options.result);
  }

  writeQuery(options: interfaces.Cache.WriteQueryOptions): void {
    const query = toQuery(options.query, options.variables as JsonObject);
    this._queryable.write(query, options.data);
  }

  writeFragment(options: interfaces.Cache.WriteFragmentOptions): void {
    // TODO: Support nested fragments.
    const query = toQuery(options.fragment, options.variables as JsonObject, options.id);
    this._queryable.write(query, options.data);
  }
}
