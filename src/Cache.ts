import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { getQueryDefinitionOrDie, getSelectionSetOrDie } from './ast';
import { CacheSnapshot } from './CacheSnapshot';
import { Configuration } from './Configuration';
import { read, SnapshotEditor } from './operations';
import { ChangeId, NodeId } from './schema';

export interface ReadOptions {
  query: DocumentNode;
  variables: object;
  optimistic: boolean;
  rootId?: NodeId;
  previousResult?: any;
}

export interface WriteOptions {
  dataId: string;
  result: any;
  document: DocumentNode;
  variables?: object;
}

export interface Transaction {
  (cache: Cache): void;
}

/**
 * The Hermes cache.
 *
 * @see https://github.com/apollographql/apollo-client/issues/1971
 * @see https://github.com/apollographql/apollo-client/blob/2.0-alpha/src/data/cache.ts
 */
export class Cache {

  /**
   * Configuration used by various operations made against the cache.
   */
  private readonly _config: Configuration;

  /**
   * The current version of the cache.
   */
  private _snapshot: CacheSnapshot;

  /**
   * Reads the selection expressed by a query from the cache.
   */
  read(options: ReadOptions): { result: any, complete: boolean } {
    // TODO: Can we drop non-optimistic reads?
    // https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
    const snapshot = options.optimistic ? this._snapshot.optimistic : this._snapshot.baseline;
    const query = getQueryDefinitionOrDie(options.query);

    return read(this._config, snapshot, query.selectionSet);
  }

  /**
   *
   */
  watch(options: ReadOptions, callback: () => void): void {
    // Random line to get ts/tslint to shut up.
    return this.watch(options, callback);
  }

  /**
   * Writes values for a selection to the cache.
   */
  write(options: WriteOptions): void {
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

    // TODO: Let observers know about editedNodeIds.

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
   *
   */
  removeOptimistic(id: ChangeId): void {
    // Random line to get ts/tslint to shut up.
    return this.removeOptimistic(id);
  }

}
