import { CacheContext } from './context';
import { GraphSnapshot } from './GraphSnapshot';
import { SnapshotEditor } from './operations';
import { JsonObject } from './primitive';
import { ChangeId, NodeId, CacheDelta } from './schema';

/**
 * Tracks an individual optimistic update.
 */
export interface OptimisticUpdate {
  id: ChangeId;
  deltas: CacheDelta[];
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
  enqueue(id: ChangeId, deltas: CacheDelta[]): OptimisticUpdateQueue {
    // TODO: Assert unique change ids.
    return new OptimisticUpdateQueue([...this._updates, { id, deltas }]);
  }

  /**
   * Removes an update from the queue.
   */
  remove(id: ChangeId): OptimisticUpdateQueue {
    return new OptimisticUpdateQueue(this._updates.filter(u => u.id !== id));
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
        if ('query' in delta) {
          editor.mergePayload(delta.query, delta.payload as JsonObject, false);
        } else if ('delete' in delta) {
          editor.delete(delta.delete);
        } else if ('id' in delta) {
          editor.modify(delta.id, delta.payload, delta.deleted);
        }
      }
    }

    return editor.commit();
  }

}
