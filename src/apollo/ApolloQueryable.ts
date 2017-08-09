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
    // TODO: Should we really remove it?
    // if (!options.returnPartialData && !complete) {
    //   // TODO: Include more detail with this error.
    //   throw new Error(`diffQuery not satisfied by the cache.`);
    // }

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
    const query = toQuery(options.query, options.variables);
    return this._queryable.read(query, optimistic).result;
  }

  readFragment<FragmentType>(options: interfaces.Cache.ReadFragmentOptions, optimistic?: true): FragmentType | null {
    // TODO: Support nested fragments.
    const query = toQuery(options.fragment, options.variables);
    return this._queryable.read(query, optimistic).result;
  }

  writeResult(options: interfaces.Cache.WriteResultOptions): void {
    const query = toQuery(options.document, options.variables, options.dataId);
    this._queryable.write(query, options.result);
  }

  writeQuery(options: interfaces.Cache.WriteQueryOptions): void {
    const query = toQuery(options.query, options.variables);
    this._queryable.write(query, options.data);
  }

  writeFragment(options: interfaces.Cache.WriteFragmentOptions): void {
    // TODO: Support nested fragments.
    const query = toQuery(options.fragment, options.variables, options.id);
    this._queryable.write(query, options.data);
  }
}
