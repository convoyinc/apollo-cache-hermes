import lodashDefaults = require('lodash.defaults');
import lodashGet = require('lodash.get');

import { Queryable } from './Queryable';
import { CacheTransaction } from './CacheTransaction';
import { CacheSnapshot } from './CacheSnapshot';
import { CacheContext } from './CacheContext';
import { GraphSnapshot } from './GraphSnapshot';
import { QueryObserver, read } from './operations';
import { OptimisticUpdateQueue } from './OptimisticUpdateQueue';
import { ChangeId, NodeId, Query } from './schema';

export type TransactionCallback = (transaction: CacheTransaction) => void;

export const defaultConfiguration:CacheContext = {
  entityIdForNode(node) {
    return lodashGet(node, 'id');
  },
}

/**
 * The Hermes cache.
 *
 * @see https://github.com/apollographql/apollo-client/issues/1971
 * @see https://github.com/apollographql/apollo-client/blob/2.0-alpha/src/data/cache.ts
 */
export class Cache implements Queryable {

  /** The cache-wide configuration. */
  private _config: CacheContext;

  /** The current version of the cache. */
  private _snapshot: CacheSnapshot;

  /** All active query observers. */
  private _observers: QueryObserver[] = [];

  constructor(config?: CacheContext) {
    const initialGraphSnapshot = new GraphSnapshot();
    this._snapshot = new CacheSnapshot(initialGraphSnapshot, initialGraphSnapshot, new OptimisticUpdateQueue());

    this._config = lodashDefaults(config, defaultConfiguration);
  }

  /**
   * Reads the selection expressed by a query from the cache.
   *
   * TODO: Can we drop non-optimistic reads?
   * https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
   */
  read(query: Query, optimistic?: boolean): { result: any, complete: boolean } {
    // TODO: Can we drop non-optimistic reads?
    // https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
    const snapshot = optimistic ? this._snapshot.optimistic : this._snapshot.baseline;
    return read(this._config, query, snapshot);
  }

  /**
   * Registers a callback that should be triggered any time the nodes selected
   * by a particular query have changed.
   */
  watch(query: Query, callback: () => void): () => void {
    const observer = new QueryObserver(this._config, query, this._snapshot.optimistic, callback);
    this._observers.push(observer);

    return () => this._removeObserver(observer);
  }

  /**
   * Writes values for a selection to the cache.
   */
  write(query: Query, payload: any): void {
    this.transaction(t => t.write(query, payload));
  }

  /**
   * Allows the caller to perform a set of changes to the cache in a
   * transactional manner.
   *
   * If a changeId is provided, the transaction will be recorded as an
   * optimistic update.
   */
  transaction(callback: TransactionCallback): void;
  transaction(changeIdOrCallback: ChangeId, callback: TransactionCallback): void;
  transaction(changeIdOrCallback: ChangeId | TransactionCallback, callback?: TransactionCallback): void {
    let changeId;
    if (typeof callback !== 'function') {
      callback = changeIdOrCallback as TransactionCallback;
    } else {
      changeId = changeIdOrCallback as ChangeId;
    }

    const transaction = new CacheTransaction(this._config, this._snapshot, changeId);
    callback(transaction);
    const { snapshot, editedNodeIds } = transaction.commit();
    this._setSnapshot(snapshot, editedNodeIds);
  }

  /**
   * Roll back a previously enqueued optimistic update.
   */
  rollback(changeId: ChangeId) {
    this.transaction(t => t.rollback(changeId));
  }

  /**
   * Resets all data tracked by the cache.
   */
  async reset(): Promise<void> {
    const allIds = new Set(this._snapshot.optimistic.allNodeIds());

    const baseline = new GraphSnapshot();
    const optimistic = baseline;
    const optimisticQueue = new OptimisticUpdateQueue();

    this._setSnapshot({ baseline, optimistic, optimisticQueue }, allIds);
  }

  // Internal

  /**
   * Unregister an observer.
   */
  private _removeObserver(observer: QueryObserver): void {
    const index = this._observers.findIndex(o => o === observer);
    if (index < 0) return;
    this._observers.splice(index, 1);
  }

  /**
   * Point the cache to a new snapshot, and let observers know of the change.
   */
  private _setSnapshot(snapshot: CacheSnapshot, editedNodeIds: Set<NodeId>): void {
    this._snapshot = snapshot;

    for (const observer of this._observers) {
      observer.consumeChanges(snapshot.optimistic, editedNodeIds);
    }
  }

}
