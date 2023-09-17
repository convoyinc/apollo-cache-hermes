import { Cache as CacheInterface } from '@apollo/client';
import { Reference, StoreObject } from '@apollo/client/utilities';

import { CacheSnapshot } from './CacheSnapshot';
import { CacheTransaction } from './CacheTransaction';
import { CacheContext } from './context';
import { GraphSnapshot, NodeSnapshotMap } from './GraphSnapshot';
import { extract, migrate, MigrationMap, prune, QueryObserver, read, restore } from './operations';
import { OptimisticUpdateQueue } from './OptimisticUpdateQueue';
import { JsonObject, JsonValue } from './primitive';
import { Queryable } from './Queryable';
import { ChangeId, NodeId, RawOperation, Serializable, StaticNodeId } from './schema';
import { addToSet, DocumentNode, hasOwn, setsHaveSomeIntersection } from './util';
import { UnsatisfiedCacheError } from './errors';
import { Hermes } from './apollo';

import BatchOptions = CacheInterface.BatchOptions;

export { MigrationMap };
export type TransactionCallback = (transaction: CacheTransaction) => any;

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
  private _cacheInstance: Hermes | undefined;
  private _transactions: CacheTransaction[] = [];
  private _editedNodeIds: Set<NodeId> = new Set();

  constructor(configuration: CacheContext.Configuration | undefined, cacheInstance: Hermes | undefined = undefined) {
    const initialGraphSnapshot = new GraphSnapshot();
    this._snapshot = new CacheSnapshot(initialGraphSnapshot, initialGraphSnapshot, new OptimisticUpdateQueue());
    this._context = new CacheContext(configuration);
    this._cacheInstance = cacheInstance;
  }

  // Maps root entity IDs to the number of times they have been retained, minus
  // the number of times they have been released. Retained entities keep other
  // entities they reference (even indirectly) from being garbage collected.
  private _rootIds: {
    [rootId: string]: number,
  } = Object.create(null);

  public retain(rootId: string): number {
    return (this._rootIds[rootId] = (this._rootIds[rootId] || 0) + 1);
  }

  public release(rootId: string): number {
    if (this._rootIds[rootId] > 0) {
      const count = --this._rootIds[rootId];
      if (!count) delete this._rootIds[rootId];
      return count;
    }
    return 0;
  }

  // Return a Set<string> of all the ID strings that have been retained by
  // this layer/root *and* any layers/roots beneath it.
  public getRootIdSet(ids = new Set<string>()) {
    Object.keys(this._rootIds).forEach(ids.add, ids);
    ids.add(StaticNodeId.QueryRoot);
    ids.add(StaticNodeId.MutationRoot);
    return ids;
  }

  // The goal of garbage collection is to remove IDs from the Root layer of the
  // store that are no longer reachable starting from any IDs that have been
  // explicitly retained (see retain and release, above). Returns an array of
  // dataId strings that were removed from the store.
  public gc() {
    const ids = this.getRootIdSet();
    const snapshot = { ...this._snapshot.optimistic._values };
    ids.forEach((id) => {
      if (hasOwn.call(snapshot, id)) {
        // Because we are iterating over an ECMAScript Set, the IDs we add here
        // will be visited in later iterations of the forEach loop only if they
        // were not previously contained by the Set.
        const node = snapshot[id];
        node.outbound?.forEach(ref => ids.add(ref.id));
        // By removing IDs from the snapshot object here, we protect them from
        // getting removed from the root store layer below.
        delete snapshot[id];
      }
    });
    const idsToRemove = Object.keys(snapshot);

    if (idsToRemove.length) {
      this.transaction(false, (t) => {
        idsToRemove.forEach(id => t.evict({ id }));
      });
    }
    return idsToRemove;
  }

  identify(object: StoreObject | Reference): string | undefined {
    return this._context.entityIdForValue(object);
  }

  transformDocument(document: DocumentNode): DocumentNode {
    return this._context.transformDocument(document);
  }

  restore(data: Serializable.GraphSnapshot, migrationMap?: MigrationMap, verifyQuery?: RawOperation) {
    const { cacheSnapshot, editedNodeIds } = restore(data, this._context);
    const migrated = migrate(cacheSnapshot, migrationMap);
    if (verifyQuery && !read(this._context, verifyQuery, migrated.baseline, Object.create(null), false).complete) {
      throw new UnsatisfiedCacheError(`Restored cache cannot satisfy the verification query`);
    }
    this._setSnapshot(migrated, editedNodeIds);
  }

  extract(optimistic: boolean, pruneQuery?: RawOperation): Serializable.GraphSnapshot {
    const cacheSnapshot = optimistic ? this._snapshot.optimistic : this._snapshot.baseline;
    return extract(
      pruneQuery ? prune(this._context, cacheSnapshot, pruneQuery).snapshot : cacheSnapshot,
      this._context
    );
  }

  /**
   * Reads the selection expressed by a query from the cache.
   *
   * TODO: Can we drop non-optimistic reads?
   * https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
   */
  read(query: RawOperation, optimistic?: boolean): CacheInterface.DiffResult<JsonValue> {
    // TODO: Can we drop non-optimistic reads?
    // https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
    const tempStore: NodeSnapshotMap = Object.create(null);
    const result = read(this._context, query, optimistic ? this._snapshot.optimistic : this._snapshot.baseline, tempStore);
    const newKeys = Object.keys(tempStore);
    if (newKeys.length) {
      this.transaction(true, (t) => {
        t.merge(tempStore);
      });
    }
    return result;
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
  watch(query: RawOperation, options: CacheInterface.WatchOptions | CacheInterface.WatchCallback): () => void {
    if (typeof options === 'function') {
      options = {
        callback: options,
        immediate: true,
        optimistic: false,
        query: query.document,
      };
    }
    const observer = new QueryObserver(this._context, query, this._snapshot.optimistic, options);
    this._observers.push(observer);

    return () => this._removeObserver(observer);
  }

  modify<Entity>(options: CacheInterface.ModifyOptions<Entity>): boolean {
    return this.transaction(options.broadcast ?? true, t => t.modify(options));
  }

  /**
   * Writes values for a selection to the cache.
   */
  write(query: RawOperation, payload: JsonObject, broadcast: boolean | undefined = true): void {
    this.transaction(broadcast, t => t.write(query, payload));
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
  transaction(
    broadcast: boolean | undefined,
    callback: TransactionCallback
  ): boolean;

  transaction(
    broadcast: boolean | undefined,
    changeIdOrCallback: ChangeId, callback: TransactionCallback
  ): boolean;

  transaction(
    broadcast: boolean | undefined,
    changeIdOrCallback: ChangeId | null | undefined,
    callback: TransactionCallback,
    onWatchUpdated?: BatchOptions<Hermes>['onWatchUpdated'],
  ): boolean;

  transaction(
    broadcast: boolean | undefined,
    changeIdOrCallback: ChangeId | TransactionCallback | undefined | null,
    callback?: TransactionCallback,
    onWatchUpdated?: CacheInterface.BatchOptions<Hermes>['onWatchUpdated']
  ): boolean {
    const { tracer } = this._context;

    let changeId;
    if (typeof callback !== 'function') {
      callback = changeIdOrCallback as TransactionCallback;
    } else {
      changeId = changeIdOrCallback as ChangeId;
    }

    let tracerContext;
    if (tracer.transactionStart) {
      tracerContext = tracer.transactionStart();
    }

    const transaction = new CacheTransaction(this._context, this._snapshot, changeId);
    this._transactions.push(transaction);
    let result;
    try {
      result = callback(transaction);
    } catch (error) {
      if (tracer.transactionEnd) {
        if (error instanceof Error) {
          tracer.transactionEnd(error.toString(), tracerContext);
        } else {
          tracer.transactionEnd('unknown error', tracerContext);
        }
      }
      return false;
    } finally {
      this._transactions.pop();
    }

    const { snapshot, editedNodeIds } = transaction.commit();
    this._setSnapshot(snapshot, editedNodeIds, broadcast, onWatchUpdated);

    if (this._transactions.length) {
      const outer = this._transactions[this._transactions.length - 1];
      outer.markEditedNodeIds(editedNodeIds);
      outer.setSnapshot(snapshot);
    }

    if (tracer.transactionEnd) {
      tracer.transactionEnd(undefined, tracerContext);
    }

    return typeof result === 'boolean' ? result : editedNodeIds.size > 0;
  }

  /**
   * Roll back a previously enqueued optimistic update.
   */
  rollback(changeId: ChangeId) {
    this.transaction(true, t => t.rollback(changeId));
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

    this._setSnapshot(new CacheSnapshot(baseline, optimistic, optimisticQueue), allIds);
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
   * Call onChange callback if one exist to notify cache users of any change.
   */
  private _setSnapshot(
    snapshot: CacheSnapshot,
    editedNodeIds: Set<NodeId>,
    broadcast: boolean | undefined = true,
    onWatchUpdated?: BatchOptions<Hermes>['onWatchUpdated'],
  ): void {
    const lastSnapshot = this._snapshot;
    this._snapshot = snapshot;

    if (lastSnapshot) {
      const { strict } = this._context;
      _copyUnaffectedCachedReads(lastSnapshot.baseline, snapshot.baseline, editedNodeIds, strict);
      // Don't bother copying the optimistic read cache unless it's actually a
      // different snapshot.
      if (snapshot.optimistic !== snapshot.baseline) {
        _copyUnaffectedCachedReads(lastSnapshot.optimistic, snapshot.optimistic, editedNodeIds, strict);
      }
    }

    if (broadcast === false) {
      addToSet(this._editedNodeIds, editedNodeIds);
      return;
    }

    if (this._transactions.length) {
      // Only broadcast after last transaction finishes
      return;
    }

    this._broadcastWatches(editedNodeIds, onWatchUpdated);

    if (this._context.onChange) {
      this._context.onChange(this._snapshot, editedNodeIds);
    }
  }

  public broadcastWatches(options?: Pick<
    BatchOptions<Hermes>,
    'optimistic' | 'onWatchUpdated'
  >) {
    this._broadcastWatches(this._editedNodeIds, options?.onWatchUpdated, options?.optimistic);
  }

  private _broadcastWatches(
    editedNodeIds: Set<NodeId>,
    onWatchUpdated?: BatchOptions<Hermes>['onWatchUpdated'],
    optimistic: string | boolean | undefined = true,
  ) {
    const snapshot = this._snapshot;

    let tracerContext;
    if (this._context.tracer.broadcastStart) {
      tracerContext = this._context.tracer.broadcastStart({ snapshot, editedNodeIds });
    }

    const graphSnapshot = optimistic ? snapshot.optimistic : snapshot.baseline;
    for (const observer of this._observers) {
      observer.consumeChanges(graphSnapshot, editedNodeIds, this._cacheInstance!, onWatchUpdated);
    }

    this._context.dirty.clear();

    if (this._context.tracer.broadcastEnd) {
      this._context.tracer.broadcastEnd({ snapshot, editedNodeIds }, tracerContext);
    }
  }

  evict(options: CacheInterface.EvictOptions): boolean {
    return this.transaction(options.broadcast ?? true, t => t.evict(options));
  }

}

/**
 * Preserves cached reads for any queries that do not overlap with the edited
 * entities in the new snapshot.
 *
 * TODO: Can we special case ROOT_QUERY somehow; any fields hanging off of it
 * tend to aggressively bust the cache, when we don't really mean to.
 */
function _copyUnaffectedCachedReads(lastSnapshot: GraphSnapshot, nextSnapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, strict: boolean) {
  for (const [operation, result] of lastSnapshot.readCache) {
    const { complete, entityIds, dynamicNodeIds } = result;
    // We don't care about incomplete results.
    if (!complete) continue;

    // If we're not in strict mode; we can carry completeness forward (and
    // not bother copying results forward, as its cheaper to just fetch again).
    if (!strict) {
      nextSnapshot.readCache.set(operation, { complete: true });
      continue;
    }

    // Nor queries where we don't know which nodes were affected.
    if (!entityIds) continue;

    // If any nodes in the cached read were edited, do not copy.
    if (entityIds && setsHaveSomeIntersection(editedNodeIds, entityIds)) continue;
    // If any dynamic nodes were edited, also do not copy.
    if (dynamicNodeIds && setsHaveSomeIntersection(editedNodeIds, dynamicNodeIds)) continue;

    nextSnapshot.readCache.set(operation, result);
  }
}
