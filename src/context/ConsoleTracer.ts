import { OperationInstance } from '../schema';

import { Tracer } from './Tracer';

const INDENT = '  ';

/**
 * The default tracer used by the cache.
 *
 * By default it logs only warnings, but a verbose mode can be enabled to log
 * out all cache operations.
 */
export class ConsoleTracer implements Tracer<void> {

  // Used when emulating grouping behavior.
  private _indent = 0;

  constructor(
    private _verbose: boolean,
    private _logger: ConsoleTracer.Logger = ConsoleTracer.DefaultLogger,
  ) {}

  warning(message: string, ...metadata: any[]) {
    if (this._verbose) return;
    this._emit('warn', message, ...metadata);
  }

  readEnd(operation: OperationInstance, info: Tracer.ReadInfo) {
    if (!this._verbose) return;
    const message = this.formatOperation('read', operation);
    if (info.cacheHit) {
      this._emit('debug', `${message} (cached)`, info.result);
    } else {
      this._emit('info', message, info.result);
    }
  }

  writeEnd(operation: OperationInstance, info: Tracer.WriteInfo) {
    if (!this._verbose) return;
    const { payload, newSnapshot, warnings } = info;
    const message = this.formatOperation('write', operation);

    // Extended logging for writes that trigger warnings.
    if (warnings) {
      this._group(message, () => {
        this._emit('warn', 'payload with warnings:', payload);
        for (const warning of warnings) {
          this._emit('warn', warning);
        }
        this._emit('debug', 'new snapshot:', newSnapshot);
      });
    } else {
      this._emit('debug', message, { payload, newSnapshot });
    }
  }

  transactionEnd(error: any) {
    if (error) {
      this._emit('warn', `Rolling transaction back due to error:`, error);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  protected formatOperation(action: string, operation: OperationInstance) {
    const { operationType, operationName } = operation.info;
    return `${action}(${operationType} ${operationName})`;
  }

  // Internal

  private _emit(level: 'debug' | 'info' | 'warn', message: string, ...metadata: any[]) {
    if (this._indent) {
      for (let i = 0; i < this._indent; i++) {
        message = `${INDENT}${message}`;
      }
    }

    this._logger[level](message, ...metadata);
  }

  private _group(message: string, callback: () => void) {
    this._groupStart(message);
    try {
      callback();
    } finally {
      this._groupEnd();
    }
  }

  private _groupStart(message: string) {
    if (this._logger.group && this._logger.groupEnd) {
      this._logger.group(message);
    } else {
      this._indent += 1;
      this._logger.info(message);
    }
  }

  private _groupEnd() {
    if (this._logger.group && this._logger.groupEnd) {
      this._logger.groupEnd();
    } else {
      this._indent -= 1;
    }
  }

}

export namespace ConsoleTracer {
  export type LogEmitter = (message: string, ...metadata: any[]) => void;

  /**
   * The minimal implementation of a logger required for ConsoleTracer to
   * perform its duties.  This is a slimmed down interface for Console.
   *
   * If either `group` or `groupEnd` are omitted, they will be approximated via
   * regular log entries.
   */
  export interface Logger {
    debug: LogEmitter;
    info: LogEmitter;
    warn: LogEmitter;
    group?: LogEmitter;
    groupEnd?: () => void;
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
