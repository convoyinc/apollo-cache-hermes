import * as makeError from 'make-error';

import { PathPart } from './primitive';
import { NodeId } from './schema';

export interface ErrorDetails {
  message: string;
  infoUrl?: string;
}
export type MessageOrDetails = string | ErrorDetails;

function _toDetails(messageOrDetails: MessageOrDetails) {
  if (typeof messageOrDetails === 'object') return messageOrDetails;
  return { message: messageOrDetails };
}

function _expandMessage(messageOrDetails: MessageOrDetails, template: string) {
  const { message, ...details } = _toDetails(messageOrDetails);
  return {
    ...details,
    message: template.replace('{{message}}', message),
  };
}

/**
 * Base error class for all errors emitted by the cache.
 *
 * Note that we rely on make-error so that we can safely extend the built in
 * Error in a cross-platform manner.
 */
export class HermesCacheError extends makeError.BaseError {
  constructor(messageOrDetails: MessageOrDetails) {
    const { message, infoUrl } = _toDetails(messageOrDetails);
    super(infoUrl ? `[${infoUrl}] ${message}` : message);
  }
}

/**
 * An error with a query - generally occurs when parsing an error.
 */
export class QueryError extends HermesCacheError {
  constructor(
    messageOrDetails: MessageOrDetails,
    // The path within the query where the error occurred.
    public readonly path: string[],
  ) {
    super(_expandMessage(messageOrDetails, `{{message}} at ${prettyPath(path)}`));
  }
}

/**
 * An error with a read query - generally occurs when data in cache is partial
 * or missing.
 */
export class UnsatisfiedCacheError extends HermesCacheError {}

/**
 * An error thrown when multiple fields within a query disagree about what they
 * are selecting.
 */
export class ConflictingFieldsError extends QueryError {
  constructor(
    messageOrDetails: MessageOrDetails,
    // The path within the query where the error occurred.
    public readonly path: string[],
    // The fields that are conflicting
    public readonly fields: any[],
  ) {
    super(_expandMessage(messageOrDetails, `Conflicting field definitions: {{message}}`), path);
  }
}

/**
 * An error occurring during a cache operation, associated with a location in
 * the cache.
 */
export class OperationError extends HermesCacheError {
  constructor(
    messageOrDetails: MessageOrDetails,
    // The path from the payload root to the node containing the error.
    public readonly prefixPath: PathPart[],
    // The node id being processed when the error occurred.
    public readonly nodeId: NodeId,
    // The path within the node where the error occurred.
    public readonly path: PathPart[],
    // A value associated with the error.
    public readonly value?: any,
  ) {
    super(_expandMessage(messageOrDetails, `{{message}} at ${prettyPath([...prefixPath, ...path])} (node ${nodeId})`));
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
    messageOrDetails: MessageOrDetails,
    // The path from the payload root to the node containing the error.
    public readonly prefixPath: PathPart[],
    // The node id being processed when the error occurred.
    public readonly nodeId: NodeId,
    // The path within the node where the error occurred.
    public readonly path: PathPart[],
    // A value that is the subject of the error
    public readonly value?: any,
  ) {
    super(_expandMessage(messageOrDetails, `Hermes BUG: {{message}}`), prefixPath, nodeId, path);
  }
}

/**
 * Renders a path as a pretty string.
 */
function prettyPath(path: PathPart[]) {
  return path.length ? path.join('.') : '[]';
}
