import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { getQueryDefinitionOrDie, getSelectionSetOrDie } from './ast';
import { CacheSnapshot } from './CacheSnapshot';
import { Configuration } from './Configuration';
import { GraphSnapshot } from './GraphSnapshot';
import { Query, QueryObserver, read, SnapshotEditor } from './operations';
import { ChangeId, NodeId, StaticNodeId } from './schema';

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
   */
  read(options: ApolloReadOptions): { result: any, complete: boolean } {
    // TODO: Can we drop non-optimistic reads?
    // https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
    const snapshot = options.optimistic ? this._snapshot.optimistic : this._snapshot.baseline;
    const query = _queryForReadOptionsOrDie(options);

    return read(this._config, query, snapshot);
  }

  /**
   *
   */
  watch(options: ApolloReadOptions, callback: () => void): Unsubscribe {
    if (!options.optimistic) {
      // Apollo Client doesn't ever call with `optimistic: false`, today.
      throw new Error(`Cache#watch does not support optimistic: false`);
    }

    const query = _queryForReadOptionsOrDie(options);
    const observer = new QueryObserver(this._config, query, this._snapshot.optimistic, callback);
    this._observers.push(observer);

    return () => this._removeObserver(observer);
  }

  /**
   * Writes values for a selection to the cache.
   */
  write(options: ApolloWriteOptions): void {
    const selection = getSelectionSetOrDie(options.document);
    const currentSnapshot = this._snapshot;

    const editor = new SnapshotEditor(this._config, currentSnapshot.baseline);
    editor.mergePayload(options.dataId, selection, options.result, options.variables);
    const { snapshot: baseline, editedNodeIds } = editor.commit();

    let optimistic = baseline;
    if (currentSnapshot.optimisticStateQueue.hasUpdates()) {
      const result = currentSnapshot.optimisticStateQueue.apply(this._config, baseline);
      optimistic = result.snapshot;
      for (const nodeId of result.editedNodeIds) {
        editedNodeIds.add(nodeId);
      }
    }

    this._broadcastChanges(optimistic, editedNodeIds);

    this._snapshot = { baseline, optimistic, optimisticStateQueue: currentSnapshot.optimisticStateQueue };
  }

  /**
   *
   */
  async reset(): Promise<void> {
    // Random line to get ts/tslint to shut up.
    return this.reset();
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
  const queryNode = getQueryDefinitionOrDie(options.query);

  return {
    rootId: StaticNodeId.QueryRoot,
    selection: queryNode.selectionSet,
    variables: options.variables,
  };
}
