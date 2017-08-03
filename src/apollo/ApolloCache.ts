
import { Cache } from '../Cache';

import * as interfaces from './interfaces';
import { toQuery } from './util';

/**
 * Apollo-specific interface to the cache.
 */
export abstract class ApolloCache implements interfaces.Cache {

  /** The underlying Hermes cache. */
  private _cache = new Cache();

  reset(): Promise<void> {
    return this._cache.reset();
  }

  diffQuery(options: interfaces.Cache.DiffQueryOptions): interfaces.Cache.DiffResult {
    const query = toQuery(options.query, options.variables);
    const { result, complete } = this._cache.read(query, options.optimistic);
    if (!options.returnPartialData) {
      // TODO: Include more detail with this error.
      throw new Error(`diffQuery not satisfied by the cache.`);
    }

    return { result, isMissing: !complete };
  }

  read(options: interfaces.Cache.ReadOptions): any {
    const query = toQuery(options.query, options.variables, options.rootId);
    const { result, complete } = this._cache.read(query, options.optimistic);
    if (!complete) {
      // TODO: Include more detail with this error.
      throw new Error(`read not satisfied by the cache.`);
    }

    return result;
  }

  readQuery<QueryType>(options: interfaces.Cache.ReadQueryOptions, optimistic?: true): QueryType {
    const query = toQuery(options.query, options.variables);
    return this._cache.read(query, optimistic).result;
  }

  readFragment<FragmentType>(options: interfaces.Cache.ReadFragmentOptions, optimistic?: true): FragmentType | null {
    // TODO: Support nested fragments.
    const query = toQuery(options.fragment, options.variables);
    return this._cache.read(query, optimistic).result;
  }

  writeResult(options: interfaces.Cache.WriteResultOptions): void {
    const query = toQuery(options.document, options.variables, options.dataId);
    this._cache.write(query, options.result);
  }

  writeQuery(options: interfaces.Cache.WriteQueryOptions): void {
    const query = toQuery(options.query, options.variables);
    this._cache.write(query, options.data);
  }

  writeFragment(options: interfaces.Cache.WriteFragmentOptions): void {
    // TODO: Support nested fragments.
    const query = toQuery(options.fragment, options.variables, options.id);
    this._cache.write(query, options.data);
  }

  removeOptimistic(id: string): void {
    // TODO: Complete Me
    return this.removeOptimistic(id);
  }

  performTransaction(transaction: interfaces.Cache.Transaction): void {
    // TODO: Complete Me
    return this.performTransaction(transaction);
  }

  recordOptimisticTransaction(transaction: interfaces.Cache.Transaction, id: string): void {
    // TODO: Complete Me
    return this.recordOptimisticTransaction(transaction, id);
  }

  watch(options: interfaces.Cache.WatchOptions, callback: interfaces.Cache.Callback): interfaces.Cache.Callback {
    const query = toQuery(options.query, options.variables, options.rootId);
    return this._cache.watch(query, callback);
  }

}
