import { CacheSnapshot } from './CacheSnapshot';
import { Configuration } from './Configuration';
import { read, write } from './operations';
import { Queryable } from './Queryable';
import { ChangeId, NodeId, Query, QuerySnapshot } from './schema';
import { collection } from './util';

/**
 *
 */
export class CacheTransaction implements Queryable {

  /**  */
  private _editedNodeIds = new Set() as Set<NodeId>;
  /**  */
  private _deltas = [] as QuerySnapshot[];

  constructor(
    private _config: Configuration,
    private _snapshot: CacheSnapshot,
    private _optimisticChangeId?: ChangeId,
  ) {}

  /**
   *
   */
  read(query: Query): { result: any, complete: boolean } {
    return read(this._config, query, this._snapshot.optimistic);
  }

  /**
   *
   */
  write(query: Query, payload: any): void {
    if (this._optimisticChangeId) {
      this._writeOptimistic(query, payload);
    } else {
      this._writeBaseline(query, payload);
    }
  }

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
   *
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
   *
   */
  private _writeOptimistic(query: Query, payload: any) {
    const current = this._snapshot;
    this._deltas.push({ query, payload });

    const { snapshot: optimistic, editedNodeIds } = write(this._config, current.baseline, query, payload);
    collection.addToSet(this._editedNodeIds, editedNodeIds);

    this._snapshot = { ...current, optimistic };
  }

}
