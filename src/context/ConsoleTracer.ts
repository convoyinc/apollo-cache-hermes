import { QueryResult } from '../operations/read';
import { EditedSnapshot } from '../operations/SnapshotEditor';
import { JsonObject } from '../primitive';
import { OperationInstance } from '../schema';

import { Tracer } from './Tracer';

/**
 * The default tracer used by the cache.
 *
 * By default it logs only warnings, but a verbose mode can be enabled to log
 * out all cache operations.
 */
export class ConsoleTracer implements Tracer<void> {

  constructor(
    private _verbose: boolean,
    private _logger: ConsoleTracer.Logger = ConsoleTracer.DefaultLogger,
  ) {}

  warning(message: string, ...metadata: any[]) {
    if (this._verbose) return;
    this._logger.warn(message, ...metadata);
  }

  readEnd(operation: OperationInstance, result: QueryResult, cacheHit: boolean) {
    if (!this._verbose) return;
    const message = this.formatOperation('read', operation);
    if (cacheHit) {
      this._logger.debug(`${message} (cached)`, result);
    } else {
      this._logger.info(message, result);
    }
  }

  writeEnd(operation: OperationInstance, payload: JsonObject, newSnapshot: EditedSnapshot) {
    if (!this._verbose) return;
    this._logger.debug(this.formatOperation('write', operation), { payload, newSnapshot });
  }

  // eslint-disable-next-line class-methods-use-this
  protected formatOperation(action: string, operation: OperationInstance) {
    const { operationType, operationName } = operation.info;
    return `${action}(${operationType} ${operationName})`;
  }

}

export namespace ConsoleTracer {
  export type LogEmitter = (message: string, ...metadata: any[]) => void;

  /**
   * The minimal implementation of a logger required for ConsoleTracer to
   * perform its duties.  This is a slimmed down interface for Console.
   */
  export interface Logger {
    debug: LogEmitter;
    info: LogEmitter;
    warn: LogEmitter;
    group: LogEmitter;
    groupEnd: () => void;
  }

  export const DefaultLogger: Logger = {
    debug: _makeDefaultEmitter('debug'),
    info: _makeDefaultEmitter('info'),
    warn:  _makeDefaultEmitter('warn'),
    // Grouping:
    group: _makeDefaultEmitter('group'),
    groupEnd: console.groupEnd ? console.groupEnd.bind(console) : () => {}, // eslint-disable-line no-console
  };
}

function _makeDefaultEmitter(level: 'debug' | 'info' | 'warn' | 'group') {
  const method = console[level] || console.log; // eslint-disable-line no-console
  return function defaultLogger(message: string, ...args: any[]) {
    method.call(console, `[Cache] ${message}`, ...args);
  };
}
