import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import { Cache as CacheInterface } from 'apollo-cache';

import { CacheSnapshot } from './CacheSnapshot';
import { CacheTransaction } from './CacheTransaction';
import { CacheContext } from './context';
import { GraphSnapshot } from './GraphSnapshot';
import { QueryObserver, read } from './operations';
import { OptimisticUpdateQueue } from './OptimisticUpdateQueue';
import { JsonObject, JsonValue } from './primitive';
import { Queryable } from './Queryable';
import { ChangeId, NodeId, RawOperation } from './schema';

export type TransactionCallback = (transaction: CacheTransaction) => void;

/**
 * The Hermes cache.
 *
 * @see https://github.com/apollographql/apollo-client/issues/1971
 * @see https://github.com/apollographql/apollo-client/blob/2.0-alpha/src/data/cache.ts
 */
export class Cache implements Queryable {

  /** The cache-wide configuration. */
  private _context: CacheContext;

  /** The current version of the cache. */
  private _snapshot: CacheSnapshot;

  /** All active query observers. */
  private _observers: QueryObserver[] = [];

  constructor(config?: CacheContext.Configuration) {
    const initialGraphSnapshot = new GraphSnapshot();
    this._snapshot = {
      baseline: initialGraphSnapshot,
      optimistic: initialGraphSnapshot,
      optimisticQueue: new OptimisticUpdateQueue(),
    };
    this._context = new CacheContext(config);
  }

  transformDocument(document: DocumentNode): DocumentNode {
    return this._context.transformDocument(document);
  }

  restore(data: GraphSnapshot): Cache {
    throw new Error('restore() is not implemented on Cache');
  }

  extract() {
    throw new Error('extract() is not implemented on Cache');
  }

  evict(query: RawOperation): { success: boolean } {
    throw new Error(`evict() is not implemented on Cache`);
  }

  /**
   * Reads the selection expressed by a query from the cache.
   *
   * TODO: Can we drop non-optimistic reads?
   * https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
   */
  read(query: RawOperation, optimistic?: boolean): { result?: JsonValue, complete: boolean } {
    // TODO: Can we drop non-optimistic reads?
    // https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
    const snapshot = optimistic ? this._snapshot.optimistic : this._snapshot.baseline;
    return read(this._context, query, snapshot);
  }

  /**
   * Retrieves the current value of the entity identified by `id`.
   */
  getEntity(id: NodeId) {
    return this._snapshot.optimistic.getNodeData(id);
  }

  /**
   * Registers a callback that should be triggered any time the nodes selected
   * by a particular query have changed.
   */
  watch(query: RawOperation, callback: CacheInterface.WatchCallback): () => void {
    const observer = new QueryObserver(this._context, query, this._snapshot.optimistic, callback);
    this._observers.push(observer);

    return () => this._removeObserver(observer);
  }

  /**
   * Writes values for a selection to the cache.
   */
  write(query: RawOperation, payload: JsonObject): void {
    this.transaction(t => t.write(query, payload));
  }

  /**
   * Allows the caller to perform a set of changes to the cache in a
   * transactional manner.
   *
   * If a changeId is provided, the transaction will be recorded as an
   * optimistic update.
   *
   * Returns whether the transaction was successful.
   */
  transaction(callback: TransactionCallback): boolean;
  transaction(changeIdOrCallback: ChangeId, callback: TransactionCallback): boolean;
  transaction(changeIdOrCallback: ChangeId | TransactionCallback, callback?: TransactionCallback): boolean {
    let changeId;
    if (typeof callback !== 'function') {
      callback = changeIdOrCallback as TransactionCallback;
    } else {
      changeId = changeIdOrCallback as ChangeId;
    }

    const transaction = new CacheTransaction(this._context, this._snapshot, changeId);
    try {
      callback(transaction);
    } catch (error) {
      this._context.error(`Rolling back transaction due to error:`, error);
      return false;
    }

    const { snapshot, editedNodeIds } = transaction.commit();
    this._setSnapshot(snapshot, editedNodeIds);

    return true;
  }

  /**
   * Roll back a previously enqueued optimistic update.
   */
  rollback(changeId: ChangeId) {
    this.transaction(t => t.rollback(changeId));
  }

  getSnapshot(): CacheSnapshot {
    return this._snapshot;
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
