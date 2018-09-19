import { Cache as CacheInterface } from 'apollo-cache';
import { CacheSnapshot } from './CacheSnapshot';
import { CacheTransaction } from './CacheTransaction';
import { CacheContext } from './context';
import { MigrationMap } from './operations';
import { JsonObject, JsonValue } from './primitive';
import { Queryable } from './Queryable';
import { ChangeId, NodeId, RawOperation, Serializable } from './schema';
import { DocumentNode } from './util';
export { MigrationMap };
export declare type TransactionCallback = (transaction: CacheTransaction) => void;
/**
 * The Hermes cache.
 *
 * @see https://github.com/apollographql/apollo-client/issues/1971
 * @see https://github.com/apollographql/apollo-client/blob/2.0-alpha/src/data/cache.ts
 */
export declare class Cache implements Queryable {
    /** The cache-wide configuration. */
    private _context;
    /** The current version of the cache. */
    private _snapshot;
    /** All active query observers. */
    private _observers;
    constructor(config?: CacheContext.Configuration);
    transformDocument(document: DocumentNode): DocumentNode;
    restore(data: Serializable.GraphSnapshot, migrationMap?: MigrationMap, verifyQuery?: RawOperation): void;
    extract(optimistic: boolean, pruneQuery?: RawOperation): Serializable.GraphSnapshot;
    evict(_query: RawOperation): {
        success: boolean;
    };
    /**
     * Reads the selection expressed by a query from the cache.
     *
     * TODO: Can we drop non-optimistic reads?
     * https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
     */
    read(query: RawOperation, optimistic?: boolean): {
        result?: JsonValue;
        complete: boolean;
    };
    /**
     * Retrieves the current value of the entity identified by `id`.
     */
    getEntity(id: NodeId): any;
    /**
     * Registers a callback that should be triggered any time the nodes selected
     * by a particular query have changed.
     */
    watch(query: RawOperation, callback: CacheInterface.WatchCallback): () => void;
    /**
     * Writes values for a selection to the cache.
     */
    write(query: RawOperation, payload: JsonObject): void;
    /**
     * Allows the caller to perform a set of changes to the cache in a
     * transactional manner.
     *
     * If a changeId is provided, the transaction will be recorded as an
     * optimistic update.
     *
     * Returns whether the transaction was successful.
     */
    transaction(callback: TransactionCallback): boolean;
    transaction(changeIdOrCallback: ChangeId, callback: TransactionCallback): boolean;
    /**
     * Roll back a previously enqueued optimistic update.
     */
    rollback(changeId: ChangeId): void;
    getSnapshot(): CacheSnapshot;
    /**
     * Resets all data tracked by the cache.
     */
    reset(): Promise<void>;
    /**
     * Unregister an observer.
     */
    private _removeObserver(observer);
    /**
     * Point the cache to a new snapshot, and let observers know of the change.
     * Call onChange callback if one exist to notify cache users of any change.
     */
    private _setSnapshot(snapshot, editedNodeIds);
}
