import { CacheSnapshot } from './CacheSnapshot';
import { Configuration } from './Configuration';
import { read, write } from './operations';
import { Queryable } from './Queryable';
import { ChangeId, NodeId, Query, QuerySnapshot } from './schema';
import { collection } from './util';

/**
 * Collects a set of edits against a version of the cache, eventually committing
 * them in the form of a new cache snapshot.
 *
 * If a ChangeId is provided, edits will be made on top of the optimistic state
 * (an optimistic update).  Otherwise edits are made against the baseline state.
 */
export class CacheTransaction implements Queryable {

  /** The set of nodes edited throughout the transaction. */
  private _editedNodeIds = new Set() as Set<NodeId>;

  /** All edits made throughout the transaction. */
  private _deltas = [] as QuerySnapshot[];

  constructor(
    private _config: Configuration,
    private _snapshot: CacheSnapshot,
    private _optimisticChangeId?: ChangeId,
  ) {}

  /**
   * Executes reads against the current values in the transaction.
   */
  read(query: Query): { result: any, complete: boolean } {
    return read(this._config, query, this._snapshot.optimistic);
  }

  /**
   * Merges a payload with the current values in the transaction.
   *
   * If this is an optimistic transaction, edits will be made directly on top of
   * any previous optimistic values.  Otherwise, edits will be made to the
   * baseline state (and any optimistic updates will be replayed over it).
   */
  write(query: Query, payload: any): void {
    if (this._optimisticChangeId) {
      this._writeOptimistic(query, payload);
    } else {
      this._writeBaseline(query, payload);
    }
  }

  /**
   * Complete the transaction, returning the new snapshot and the ids of any
   * nodes that were edited.
   */
  commit(): { snapshot: CacheSnapshot, editedNodeIds: Set<NodeId> } {
    let snapshot = this._snapshot;
    if (this._optimisticChangeId) {
      snapshot = {
        ...snapshot,
        optimisticQueue: snapshot.optimisticQueue.enqueue(this._optimisticChangeId, this._deltas),
      };
    }

    return { snapshot, editedNodeIds: this._editedNodeIds };
  }

  /**
   * Merge a payload with the baseline snapshot.
   */
  private _writeBaseline(query: Query, payload: any) {
    const current = this._snapshot;

    const { snapshot: baseline, editedNodeIds } = write(this._config, current.baseline, query, payload);
    collection.addToSet(this._editedNodeIds, editedNodeIds);

    let optimistic = baseline;
    if (current.optimisticQueue.hasUpdates()) {
      const result = current.optimisticQueue.apply(this._config, baseline);
      optimistic = result.snapshot;
      collection.addToSet(this._editedNodeIds, result.editedNodeIds);
    }

    this._snapshot = { ...current, baseline, optimistic };
  }

  /**
   * Merge a payload with the optimistic snapshot.
   */
  private _writeOptimistic(query: Query, payload: any) {
    const current = this._snapshot;
    this._deltas.push({ query, payload });

    const { snapshot: optimistic, editedNodeIds } = write(this._config, current.baseline, query, payload);
    collection.addToSet(this._editedNodeIds, editedNodeIds);

    this._snapshot = { ...current, optimistic };
  }

}
