import { CacheContext } from './CacheContext';
import { GraphSnapshot } from './GraphSnapshot';
import { SnapshotEditor } from './operations';
import { ChangeId, NodeId, QuerySnapshot } from './schema';

/**
 * Tracks an individual optimistic update.
 */
export interface OptimisticUpdate {
  id: ChangeId;
  deltas: QuerySnapshot[];
}

/**
 * Manages a queue of optimistic updates, and the values they express on top of
 * existing cache snapshots.
 */
export class OptimisticUpdateQueue {

  constructor(
    /**
     * The queue of updates, in order of oldest (lowest precedence) to newest
     * (highest precedence).
     */
    private _updates = [] as OptimisticUpdate[],
  ) {}

  /**
   * Appends a new optimistic update to the queue.
   */
  enqueue(id: ChangeId, deltas: QuerySnapshot[]): OptimisticUpdateQueue {
    // TODO: Assert unique change ids.
    return new OptimisticUpdateQueue([...this._updates, { id, deltas }]);
  }

  /**
   * Removes an update from the queue.
   */
  remove(id: ChangeId): OptimisticUpdateQueue {
    return new OptimisticUpdateQueue(this._updates.filter(u => u.id === id));
  }

  /**
   * Whether there are any updates to apply.
   */
  hasUpdates(): boolean {
    return this._updates.length > 0;
  }

  /**
   * Applies the current optimistic updates to a snapshot.
   */
  apply(context: CacheContext, snapshot: GraphSnapshot): { snapshot: GraphSnapshot, editedNodeIds: Set<NodeId> } {
    const editor = new SnapshotEditor(context, snapshot);
    for (const update of this._updates) {
      for (const delta of update.deltas) {
        editor.mergePayload(delta.query, delta.payload);
      }
    }

    return editor.commit();
  }

}
