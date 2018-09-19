import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { NodeId, RawOperation } from '../schema';
import { QueryResult } from './read';
export declare type Callback = (result: QueryResult) => void;
/**
 * Observes a query, triggering a callback when nodes within it have changed.
 *
 * @internal
 */
export declare class QueryObserver {
    /** Cache configuration/context to use when executing queries. */
    private _context;
    /** The query being observed. */
    private _query;
    /** The most recent result */
    private _result?;
    /** The callback to trigger when observed nodes have changed. */
    private _callback;
    constructor(context: CacheContext, query: RawOperation, snapshot: GraphSnapshot, callback: Callback);
    /**
     * We expect the cache to tell us whenever there is a new snapshot, and which
     * nodes have changed.
     */
    consumeChanges(snapshot: GraphSnapshot, changedNodeIds: Set<NodeId>): void;
    /**
     * Whether there are any changed nodes that overlap with the ones we're
     * observing.
     */
    private _hasUpdate(_changedNodeIds);
    /**
     * Re-query and trigger the callback.
     */
    private _update(snapshot);
}
