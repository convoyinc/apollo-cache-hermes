import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { CacheSnapshot } from './CacheSnapshot';
import { Configuration } from './Configuration';
import { GraphSnapshot } from './GraphSnapshot';
import { QueryObserver, read, SnapshotEditor } from './operations';
import { OptimisticUpdateQueue } from './OptimisticUpdateQueue';
import { ChangeId, NodeId, Query, StaticNodeId } from './schema';
import { ast, collection } from './util';

export interface ApolloReadOptions {
  query: DocumentNode;
  variables: object;
  optimistic: boolean;
  rootId?: NodeId;
  previousResult?: any;
}

export interface ApolloWriteOptions {
  dataId: string;
  result: any;
  document: DocumentNode;
  variables?: object;
}

export type Transaction = (cache: Cache) => void;
export type Unsubscribe = () => void;

/**
 * The Hermes cache.
 *
 * @see https://github.com/apollographql/apollo-client/issues/1971
 * @see https://github.com/apollographql/apollo-client/blob/2.0-alpha/src/data/cache.ts
 */
export class Cache {

  /** Configuration used by various operations made against the cache. */
  private readonly _config: Configuration;

  /** The current version of the cache. */
  private _snapshot: CacheSnapshot;

  /** All active query observers. */
  private _observers: QueryObserver[];

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
   *
   */
  watch(query: Query, callback: () => void): Unsubscribe {
    const observer = new QueryObserver(this._config, query, this._snapshot.optimistic, callback);
    this._observers.push(observer);

    return () => this._removeObserver(observer);
  }

  /**
   * Writes values for a selection to the cache.
   */
  write(query: Query, payload: any): void {
    const currentSnapshot = this._snapshot;

    const editor = new SnapshotEditor(this._config, currentSnapshot.baseline);
    editor.mergePayload(query, payload);
    const { snapshot: baseline, editedNodeIds } = editor.commit();

    let optimistic = baseline;
    if (currentSnapshot.optimisticQueue.hasUpdates()) {
      const result = currentSnapshot.optimisticQueue.apply(this._config, baseline);
      optimistic = result.snapshot;
      collection.addToSet(editedNodeIds, result.editedNodeIds);
    }

    this._broadcastChanges(optimistic, editedNodeIds);

    this._snapshot = { baseline, optimistic, optimisticQueue: currentSnapshot.optimisticQueue };
  }

  /**
   * Resets all data tracked by the cache.
   */
  async reset(): Promise<void> {
    const allIds = new Set(this._snapshot.optimistic.allNodeIds());

    const baseline = new GraphSnapshot();
    const optimistic = baseline;
    const optimisticQueue = new OptimisticUpdateQueue();
    this._snapshot = { baseline, optimistic, optimisticQueue };

    this._broadcastChanges(optimistic, allIds);
  }

  /**
   *
   */
  performTransaction(transaction: Transaction): void {
    // Random line to get ts/tslint to shut up.
    return this.performTransaction(transaction);
  }

  /**
   *
   */
  recordOptimisticTransaction(transaction: Transaction, id: ChangeId): void {
    // Random line to get ts/tslint to shut up.
    return this.recordOptimisticTransaction(transaction, id);
  }

  /**
   * Remove an optimistic update from the queue.
   */
  removeOptimistic(id: ChangeId): void {
    // Random line to get ts/tslint to shut up.
    return this.removeOptimistic(id);
  }

  // Internal

  /**
   *
   */
  private _removeObserver(observer: QueryObserver): void {
    const index = this._observers.findIndex(o => o === observer);
    if (index < 0) return;
    this._observers.splice(index, 1);
  }

  /**
   *
   */
  private _broadcastChanges(snapshot: GraphSnapshot, changedNodeIds: Set<NodeId>): void {
    for (const observer of this._observers) {
      observer.consumeChanges(snapshot, changedNodeIds);
    }
  }

}

/**
 *
 */
export function _queryForReadOptionsOrDie(options: ApolloReadOptions): Query {
  const queryNode = ast.getQueryDefinitionOrDie(options.query);

  return {
    rootId: StaticNodeId.QueryRoot,
    selection: queryNode.selectionSet,
    variables: options.variables,
  };
}
