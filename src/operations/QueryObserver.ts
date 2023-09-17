import { Cache } from '@apollo/client';
import isEqual from '@wry/equality';

import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { NodeId, RawOperation } from '../schema';
import { Hermes } from '../apollo';

import { QueryResult, read } from './read';

import WatchOptions = Cache.WatchOptions;

/**
 * Observes a query, triggering a callback when nodes within it have changed.
 *
 * @internal
 */
export class QueryObserver {

  /** Cache configuration/context to use when executing queries. */
  private _context: CacheContext;
  /** The query being observed. */
  private _query: RawOperation;
  /** The most recent result */
  private _result: QueryResult;
  /** The callback to trigger when observed nodes have changed. */
  private _options: WatchOptions;

  constructor(context: CacheContext, query: RawOperation, snapshot: GraphSnapshot, options: WatchOptions) {
    this._context = context;
    this._query = query;
    this._options = options;
    this._result = read(context, query, snapshot, Object.create(null), context.strict);
    if (options.immediate) {
      options.lastDiff = this._result;
      this._update();
    }
  }

  /**
   * We expect the cache to tell us whenever there is a new snapshot, and which
   * nodes have changed.
   */
  consumeChanges(
    snapshot: GraphSnapshot,
    changedNodeIds: Set<NodeId>,
    cacheInstance: Hermes,
    onWatchUpdated?: Cache.BatchOptions<Hermes>['onWatchUpdated'],
  ): void {
    const lastDiff = this._options.lastDiff;
    if (lastDiff && !this._hasUpdate(changedNodeIds)) return;
    // Note that if strict mode is disabled, we _do not_ ask for node ids.
    //
    // This effectively circumvents the logic in _hasUpdate (entityIds will be
    // undefined).
    const operation = this._context.parseOperation(this._query);
    const readResult = read(this._context, this._query, snapshot, Object.create(null), this._context.strict);
    this._result = readResult;
    const result = readResult.result;
    this._options.lastDiff = readResult;
    const rootKeys = Object.keys(operation.parsedQuery);
    if (!readResult.complete && (!result || !rootKeys.some(key => key in result))) {
      return;
    }
    const lastResult = lastDiff?.result;
    const sameAsBefore = result && lastResult && rootKeys.every(key => isEqual(result[key], lastResult[key]));
    const dirtyKeys = this._context.dirty.get(operation.rootId);
    if (sameAsBefore && !(dirtyKeys && rootKeys.some(key => dirtyKeys.has(key)))) {
      return;
    }
    const shouldCancel = onWatchUpdated?.call(cacheInstance, this._options, readResult, lastDiff) === false;
    if (shouldCancel) {
      // Returning false from the onWatchUpdated callback will prevent
      // calling c.callback(diff) for this watcher.
      return;
    }
    if (sameAsBefore) {
      return;
    }
    this._update();
  }

  /**
   * Whether there are any changed nodes that overlap with the ones we're
   * observing.
   */
  private _hasUpdate(_changedNodeIds: Set<NodeId>): boolean {
    const { complete, entityIds, dynamicNodeIds } = this._result!;
    if (!complete) return true;
    // We can't know if we have no ids to test against. Favor updating.
    if (!entityIds) return true;

    for (const nodeId of _changedNodeIds) {
      if (entityIds.has(nodeId)) return true;
      if (dynamicNodeIds && dynamicNodeIds.has(nodeId)) return true;
    }

    return false;
  }

  /**
   * Trigger the callback.
   */
  private _update(): void {
    this._options.callback(this._result);
  }

}
