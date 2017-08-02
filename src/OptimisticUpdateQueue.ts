import { SelectionSetNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { Configuration } from './Configuration';
import { GraphSnapshot } from './GraphSnapshot';
import { SnapshotEditor } from './operations';
import { ChangeId, NodeId } from './schema';

/**
 * Tracks an individual optimistic update.
 */
interface OptimisticUpdate {
  id: ChangeId;
  rootId: NodeId;
  selection: SelectionSetNode;
  payload: any;
}

/**
 * Manages a queue of optimistic updates, and the values they express on top of
 * existing cache snapshots.
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
  enqueue(id: ChangeId, rootId: NodeId, selection: SelectionSetNode, payload: any): void {
    // TODO: Assert unique change ids.
    this._updates.push({ id, rootId, selection, payload });
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
   * Applies the current optimistic updates to a snapshot.
   */
  apply(config: Configuration, snapshot: GraphSnapshot): { snapshot: GraphSnapshot, editedNodeIds: Set<NodeId> } {
    const editor = new SnapshotEditor(config, snapshot);
    for (const update of this._updates) {
      editor.mergePayload(update.rootId, update.selection, update.payload);
    }

    return editor.commit();
  }

}
