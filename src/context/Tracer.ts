import { QueryResult } from '../operations/read';
import { EditedSnapshot } from '../operations/SnapshotEditor';
import { JsonObject } from '../primitive';
import { RawOperation, OperationInstance } from '../schema';

export namespace Tracer {
  export interface ReadResult {
    result: QueryResult;
    cacheHit: boolean;
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
   *
   */
  readStart?: (rawOperation: RawOperation) => TActionContext;

  /**
   *
   */
  readEnd?: (operation: OperationInstance, result: Tracer.ReadResult, context: TActionContext) => void;

  /**
   *
   */
  writeStart?: (rawOperation: RawOperation, payload: JsonObject) => TActionContext;

  /**
   *
   */
  writeEnd?: (operation: OperationInstance, payload: JsonObject, newSnapshot: EditedSnapshot, context: TActionContext) => void;

}
