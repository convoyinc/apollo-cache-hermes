import { QueryResult } from '../operations/read';
import { EditedSnapshot } from '../operations/SnapshotEditor';
import { JsonObject } from '../primitive';
import { RawOperation, OperationInstance } from '../schema';

export namespace Tracer {
  export interface ReadResult {
    /** The result payload that satisfies the query. */
    result: QueryResult;
    /** Whether this request was memoized. */
    cacheHit: boolean;
  }

  export interface WriteResult {
    /** The payload to be written to the cache. */
    payload: JsonObject;
    /** The new snapshot (and metadata) after the write is complete. */
    newSnapshot: EditedSnapshot;
    /** Any warnings that occurred during the write. */
    warnings?: string[];
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
  readEnd?: (operation: OperationInstance, result: Tracer.ReadResult, context: TActionContext) => void;

  /**
   * Start of a request to write to the cache.
   */
  writeStart?: (rawOperation: RawOperation, payload: JsonObject) => TActionContext;

  /**
   * Successful end of a request to write to the cache.
   */
  writeEnd?: (operation: OperationInstance, result: Tracer.WriteResult, context: TActionContext) => void;

}
