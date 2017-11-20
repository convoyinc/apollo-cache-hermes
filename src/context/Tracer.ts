import { CacheSnapshot } from '../CacheSnapshot';
import { QueryResult } from '../operations/read';
import { EditedSnapshot } from '../operations/SnapshotEditor';
import { JsonObject } from '../primitive';
import { NodeId, OperationInstance, RawOperation } from '../schema';

export namespace Tracer {
  export interface ReadInfo {
    /** The result payload that satisfies the query. */
    result: QueryResult;
    /** Whether this request was memoized. */
    cacheHit: boolean;
  }

  export interface WriteInfo {
    /** The payload to be written to the cache. */
    payload: JsonObject;
    /** The new snapshot (and metadata) after the write is complete. */
    newSnapshot: EditedSnapshot;
    /** Any warnings that occurred during the write. */
    warnings?: string[];
  }

  export interface BroadcastInfo {
    /** The snapshot being broadcast. */
    snapshot: CacheSnapshot;
    /** Nodes within the snapshot that were edited. */
    editedNodeIds: Set<NodeId>;
  }
}

/**
 * Event handlers that are called at various locations within the cache.
 *
 * Generally, this is expected to be used for instrumentation of the cache:
 * logging, performance monitoring, etc.
 *
 * Many actions are grouped into start/end pairs.  If a value is returned from
 * the start handler, it will be passed to the corresponding end handler as its
 * last (context) argument.  Handy for passing timestamps, ids, etc between
 * paired handlers.
 */
export interface Tracer<TActionContext = any> {

  /**
   * The cache encountered a non-fatal issue.
   */
  warning?: (message: string, ...metadata: any[]) => void;

  /**
   * Start of a request to read from the cache.
   */
  readStart?: (rawOperation: RawOperation) => TActionContext;

  /**
   * Successful end of a request to read from the cache.
   */
  readEnd?: (operation: OperationInstance, info: Tracer.ReadInfo, context: TActionContext) => void;

  /**
   * Start of a request to write to the cache.
   */
  writeStart?: (rawOperation: RawOperation, payload: JsonObject) => TActionContext;

  /**
   * Successful end of a request to write to the cache.
   */
  writeEnd?: (operation: OperationInstance, info: Tracer.WriteInfo, context: TActionContext) => void;

  /**
   * Start of a request to broadcast changes to cache observers.
   */
  broadcastStart?: (info: Tracer.BroadcastInfo) => TActionContext;

  /**
   * End of a request to broadcast changes to cache observers.
   */
  broadcastEnd?: (info: Tracer.BroadcastInfo, contet: TActionContext) => void;

}
