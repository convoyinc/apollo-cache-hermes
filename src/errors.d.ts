import * as makeError from 'make-error';
import { PathPart } from './primitive';
import { NodeId } from './schema';
/**
 * Base error class for all errors emitted by the cache.
 *
 * Note that we rely on make-error so that we can safely extend the built in
 * Error in a cross-platform manner.
 */
export declare class CacheError extends makeError.BaseError {
}
/**
 * An error with a query - generally occurs when parsing an error.
 */
export declare class QueryError extends CacheError {
    readonly path: string[];
    constructor(message: string, path: string[]);
}
/**
 * An error with a read query - generally occurs when data in cache is partial
 * or missing.
 */
export declare class UnsatisfiedCacheError extends CacheError {
}
/**
 * An error thrown when multiple fields within a query disagree about what they
 * are selecting.
 */
export declare class ConflictingFieldsError extends QueryError {
    readonly path: string[];
    readonly fields: any[];
    constructor(message: string, path: string[], fields: any[]);
}
/**
 * An error occurring during a cache operation, associated with a location in
 * the cache.
 */
export declare class OperationError extends CacheError {
    readonly prefixPath: PathPart[];
    readonly nodeId: NodeId;
    readonly path: PathPart[];
    readonly value: any;
    constructor(message: string, prefixPath: PathPart[], nodeId: NodeId, path: PathPart[], value?: any);
}
/**
 * An error occurring while processing a payload for a write operation.
 */
export declare class InvalidPayloadError extends OperationError {
}
/**
 * An error occurring as the result of a cache bug.
 */
export declare class CacheConsistencyError extends OperationError {
    readonly prefixPath: PathPart[];
    readonly nodeId: NodeId;
    readonly path: PathPart[];
    readonly value: any;
    constructor(message: string, prefixPath: PathPart[], nodeId: NodeId, path: PathPart[], value?: any);
}
