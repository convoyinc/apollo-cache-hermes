import { OperationInstance } from '../schema';
import { Tracer } from './Tracer';
/**
 * The default tracer used by the cache.
 *
 * By default it logs only warnings, but a verbose mode can be enabled to log
 * out all cache operations.
 */
export declare class ConsoleTracer implements Tracer<void> {
    private _verbose;
    private _logger;
    private _indent;
    constructor(_verbose: boolean, _logger?: ConsoleTracer.Logger);
    warning(message: string, ...metadata: any[]): void;
    readEnd(operation: OperationInstance, info: Tracer.ReadInfo): void;
    writeEnd(operation: OperationInstance, info: Tracer.WriteInfo): void;
    transactionEnd(error: any): void;
    protected formatOperation(action: string, operation: OperationInstance): string;
    private _emit(level, message, ...metadata);
    private _group(message, callback);
    private _groupStart(message);
    private _groupEnd();
}
export declare namespace ConsoleTracer {
    type LogEmitter = (message: string, ...metadata: any[]) => void;
    /**
     * The minimal implementation of a logger required for ConsoleTracer to
     * perform its duties.  This is a slimmed down interface for Console.
     *
     * If either `group` or `groupEnd` are omitted, they will be approximated via
     * regular log entries.
     */
    interface Logger {
        debug: LogEmitter;
        info: LogEmitter;
        warn: LogEmitter;
        group?: LogEmitter;
        groupEnd?: () => void;
    }
    const DefaultLogger: Logger;
}
