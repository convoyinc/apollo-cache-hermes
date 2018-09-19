import { CacheSnapshot } from './CacheSnapshot';
import { CacheContext } from './context';
import { GraphSnapshot } from './GraphSnapshot';
import { NodeSnapshot } from './nodes';
import { JsonObject, JsonValue } from './primitive';
import { Queryable } from './Queryable';
import { ChangeId, NodeId, OperationInstance, RawOperation } from './schema';
import { DocumentNode } from './util';
/**
 * Collects a set of edits against a version of the cache, eventually committing
 * them in the form of a new cache snapshot.
 *
 * If a ChangeId is provided, edits will be made on top of the optimistic state
 * (an optimistic update).  Otherwise edits are made against the baseline state.
 */
export declare class CacheTransaction implements Queryable {
    private _context;
    private _snapshot;
    private _optimisticChangeId;
    /** The set of nodes edited throughout the transaction. */
    private _editedNodeIds;
    /** All edits made throughout the transaction. */
    private _deltas;
    /** All queries written during the transaction. */
    private _writtenQueries;
    /** The original snapshot before the transaction began. */
    private _parentSnapshot;
    constructor(_context: CacheContext, _snapshot: CacheSnapshot, _optimisticChangeId?: string | undefined);
    isOptimisticTransaction(): true | undefined;
    transformDocument(document: DocumentNode): DocumentNode;
    /**
     * Executes reads against the current values in the transaction.
     */
    read(query: RawOperation): {
        result?: JsonValue;
        complete: boolean;
    };
    /**
     * Merges a payload with the current values in the transaction.
     *
     * If this is an optimistic transaction, edits will be made directly on top of
     * any previous optimistic values.  Otherwise, edits will be made to the
     * baseline state (and any optimistic updates will be replayed over it).
     */
    write(query: RawOperation, payload: JsonObject): void;
    /**
     * Roll back a previously enqueued optimistic update.
     */
    rollback(changeId: ChangeId): void;
    /**
     * Removes values from the current transaction
     */
    evict(_query: RawOperation): {
        success: boolean;
    };
    /**
     * Complete the transaction, returning the new snapshot and the ids of any
     * nodes that were edited.
     */
    commit(): {
        snapshot: CacheSnapshot;
        editedNodeIds: Set<NodeId>;
        writtenQueries: Set<OperationInstance>;
    };
    getPreviousNodeSnapshot(nodeId: NodeId): NodeSnapshot | undefined;
    getCurrentNodeSnapshot(nodeId: NodeId): NodeSnapshot | undefined;
    /**
     * Emits change events for any callbacks configured via
     * CacheContext#entityUpdaters.
     */
    private _triggerEntityUpdaters();
    /**
     * Merge a payload with the baseline snapshot.
     */
    private _writeBaseline(query, payload);
    /**
     * Given a baseline snapshot, build an optimistic one from it.
     */
    _buildOptimisticSnapshot(baseline: GraphSnapshot): GraphSnapshot;
    /**
     * Merge a payload with the optimistic snapshot.
     */
    private _writeOptimistic(query, payload);
}
