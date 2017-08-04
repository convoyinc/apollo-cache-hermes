import { Configuration } from '../Configuration';
import { GraphSnapshot } from '../GraphSnapshot';
import { NodeId, Query } from '../schema';

import { QueryResult, QueryResultWithNodeIds, read } from './read';

export type Callback = (result: QueryResult) => void;

/**
 * Observes a query, triggering a callback when nodes within it have changed.
 *
 * @internal
 */
export class QueryObserver {

  /** Cache configuration to use when executing queries. */
  private _config: Configuration;
  /** The query being observed. */
  private _query: Query;
  /** The most recent result */
  private _result: QueryResultWithNodeIds;
  /** The callback to trigger when observed nodes have changed. */
  private _callback: Callback;

  constructor(config: Configuration, query: Query, snapshot: GraphSnapshot, callback: Callback) {
    this._config = config;
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
  private _hasUpdate(changedNodeIds: Set<NodeId>): boolean {
    for (const nodeId of changedNodeIds) {
      if (this._result.nodeIds.has(nodeId)) return true;
    }
    return false;
  }

  /**
   * Re-query and trigger the callback.
   */
  private _update(snapshot: GraphSnapshot): void {
    this._result = read(this._config, this._query, snapshot, true);
    this._callback(this._result);
  }

}
