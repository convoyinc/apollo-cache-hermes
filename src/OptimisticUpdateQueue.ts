import { Configuration } from './Configuration';
import { GraphSnapshot } from './GraphSnapshot';
import { SnapshotEditor } from './operations';
import { ChangeId, NodeId, Query } from './schema';

/**
 * Tracks an individual optimistic update.
 */
interface OptimisticUpdate {
  id: ChangeId;
  query: Query;
  payload: any;
}

/**
 * Manages a queue of optimistic updates, and the values they express on top of
 * existing cache snapshots.
 *
 * TODO: Should we make this immutable, since it's included in CacheSnapshots?
 */
export class OptimisticUpdateQueue {

  /**
   * The queue of updates, in order of oldest (lowest precedence) to newest
   * (highest precedence).
   */
  private _updates = [] as OptimisticUpdate[];

  /**
   * Appends a new optimistic update to the queue.
   */
  enqueue(id: ChangeId, query: Query, payload: any): void {
    // TODO: Assert unique change ids.
    this._updates.push({ id, query, payload });
  }

  /**
   * Removes an update from the queue.
   */
  remove(id: ChangeId): void {
    const index = this._updates.findIndex(u => u.id === id);
    if (index < 0) {
      throw new Error(`Change ${id} not found in the optimistic update queue`);
    }
    this._updates.splice(index, 1);
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
  apply(config: Configuration, snapshot: GraphSnapshot): { snapshot: GraphSnapshot, editedNodeIds: Set<NodeId> } {
    const editor = new SnapshotEditor(config, snapshot);
    for (const update of this._updates) {
      editor.mergePayload(update.query, update.payload);
    }

    return editor.commit();
  }

}
