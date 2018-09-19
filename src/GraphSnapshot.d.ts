import { NodeSnapshot } from './nodes';
import { QueryResult, QueryResultWithNodeIds } from './operations/read';
import { NodeId, OperationInstance } from './schema';
export declare type NodeSnapshotMap = {
    [Key in NodeId]: NodeSnapshot;
};
/**
 * Maintains an identity map of all value snapshots that reference into a
 * particular version of the graph.
 *
 * Provides an immutable view into the graph at a point in time.
 *
 * Also provides a place to hang per-snapshot caches off of.
 */
export declare class GraphSnapshot {
    _values: NodeSnapshotMap;
    /** Cached results for queries. */
    readonly readCache: Map<OperationInstance, QueryResult | QueryResultWithNodeIds>;
    /**
     * @internal
     */
    constructor(_values?: NodeSnapshotMap);
    /**
     * Retrieves the value identified by `id`.
     */
    getNodeData(id: NodeId): any;
    /**
     * Returns whether `id` exists as an value in the graph.
     */
    has(id: NodeId): boolean;
    /**
     * Retrieves the snapshot for the value identified by `id`.
     *
     * @internal
     */
    getNodeSnapshot(id: NodeId): Readonly<NodeSnapshot> | undefined;
    /**
     * Returns the set of ids present in the snapshot.
     *
     * @internal
     */
    allNodeIds(): NodeId[];
    /**
     * Freezes the snapshot (generally for development mode)
     *
     * @internal
     */
    freeze(): void;
}
