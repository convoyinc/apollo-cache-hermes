import { CacheContext } from './context';
import { GraphSnapshot } from './GraphSnapshot';
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
export declare class OptimisticUpdateQueue {
    /**
     * The queue of updates, in order of oldest (lowest precedence) to newest
     * (highest precedence).
     */
    private _updates;
    constructor(
        /**
         * The queue of updates, in order of oldest (lowest precedence) to newest
         * (highest precedence).
         */
        _updates?: OptimisticUpdate[]);
    /**
     * Appends a new optimistic update to the queue.
     */
    enqueue(id: ChangeId, deltas: QuerySnapshot[]): OptimisticUpdateQueue;
    /**
     * Removes an update from the queue.
     */
    remove(id: ChangeId): OptimisticUpdateQueue;
    /**
     * Whether there are any updates to apply.
     */
    hasUpdates(): boolean;
    /**
     * Applies the current optimistic updates to a snapshot.
     */
    apply(context: CacheContext, snapshot: GraphSnapshot): {
        snapshot: GraphSnapshot;
        editedNodeIds: Set<NodeId>;
    };
}
