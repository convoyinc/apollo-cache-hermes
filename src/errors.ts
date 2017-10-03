import * as makeError from 'make-error';

import { PathPart } from './primitive';
import { NodeId } from './schema';

/**
 * Base error class for all errors emitted by the cache.
 *
 * Note that we rely on make-error so that we can safely extend the built in
 * Error in a cross-platform manner.
 */
export class CacheError extends makeError.BaseError {}

/**
 * An error with a query - generally occurs when parsing an error.
 */
export class QueryError extends CacheError {
  constructor(
    message: string,
    // The path within the query where the error occurred.
    public readonly path: string[],
  ) {
    super(`${message} at ${JSON.stringify(path)}`);
  }
}

/**
 * An error thrown when multiple fields within a query disagree about what they
 * are selecting.
 */
export class ConflictingFieldsError extends QueryError {
  constructor(
    message: string,
    // The path within the query where the error occurred.
    public readonly path: string[],
    // The fields that are conflicting
    public readonly fields: any[],
  ) {
    super(`Conflicting field definitions: ${message}`, path);
  }
}

/**
 * An error occurring during a cache operation, associated with a location in
 * the cache.
 */
export class OperationError extends CacheError {
  constructor(
    message: string,
    // The node id being processed when the error occurred.
    public readonly nodeId: NodeId,
    // The path within the node where the error occurred.
    public readonly path: PathPart[],
    // A value associated with the error.
    public readonly value?: any,
  ) {
    super(`${message} at ${JSON.stringify(path)} of node ${nodeId}`);
  }
}

/**
 * An error occurring while processing a payload for a write operation.
 */
export class InvalidPayloadError extends OperationError {}

/**
 * An error occurring as the result of a cache bug.
 */
export class CacheConsistencyError extends OperationError {
  constructor(
    message: string,
    // The node id being processed when the error occurred.
    public readonly nodeId: NodeId,
    // The path within the node where the error occurred.
    public readonly path: PathPart[],
    // A value that is the subject of the error
    public readonly value?: any,
  ) {
    super(`Hermes BUG: ${message}`, nodeId, path);
  }
}
