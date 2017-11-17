import { Tracer } from '../tracing/Tracer';

/**
 * The default tracer used by the cache.
 *
 * By default it logs only warnings, but a verbose mode can be enabled to log
 * out all cache operations.
 */
export class ConsoleTracer implements Tracer {

  constructor(
    private _verbose: boolean,
    private _logger: ConsoleTracer.Logger = ConsoleTracer.DefaultLogger,
  ) {}

  warning(message: string, ...metadata: any[]) {
    if (this._verbose) return;
    this._logger.warn(message, ...metadata);
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
    warn: LogEmitter;
    group: LogEmitter;
    groupEnd: () => void;
  }

  export const DefaultLogger: Logger = {
    debug: _makeDefaultEmitter('debug'),
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
