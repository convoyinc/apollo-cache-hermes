import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { NodeId, RawOperation } from '../schema';

import { QueryResult, read } from './read';

export type Callback = (result: QueryResult) => void;

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
  private _result?: QueryResult;
  /** The callback to trigger when observed nodes have changed. */
  private _callback: Callback;

  constructor(context: CacheContext, query: RawOperation, snapshot: GraphSnapshot, callback: Callback) {
    this._context = context;
    this._query = query;
    this._callback = callback;

    this._update(snapshot);
  }

  /**
   * We expect the cache to tell us whenever there is a new snapshot, and which
   * nodes have changed.
   */
  consumeChanges(snapshot: GraphSnapshot, changedNodeIds: Set<NodeId>): void {
    if (!this._hasUpdate(changedNodeIds)) return;
    this._update(snapshot);
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
   * Re-query and trigger the callback.
   */
  private _update(snapshot: GraphSnapshot): void {
    // Note that if strict mode is disabled, we _do not_ ask for node ids.
    //
    // This effectively circumvents the logic in _hasUpdate (entityIds will be
    // undefined).
    this._result = read(this._context, this._query, snapshot, this._context.strict);
    this._callback(this._result);
  }

}
