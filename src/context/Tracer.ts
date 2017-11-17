import { QueryResult } from '../operations/read';
import { EditedSnapshot } from '../operations/SnapshotEditor';
import { JsonObject } from '../primitive';
import { RawOperation, OperationInstance } from '../schema';

/**
 * Event handlers that are called at various locations within the cache.
 *
 * Generally, this is expected to be used for instrumentation of the cache:
 * logging, performance monitoring, etc.
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
  readEnd?: (operation: OperationInstance, result: QueryResult, cacheHit: boolean, context: TActionContext) => void;

  /**
   *
   */
  writeStart?: (rawOperation: RawOperation, payload: JsonObject) => TActionContext;

  /**
   *
   */
  writeEnd?: (operation: OperationInstance, payload: JsonObject, newSnapshot: EditedSnapshot, context: TActionContext) => void;

}
