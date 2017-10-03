import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import lodashIsEqual = require('lodash.isequal');
import lodashGet = require('lodash.get');

import { deprecatedExpandVariables } from '../DynamicField';
import { areChildrenDynamic, expandVariables } from '../ParsedQueryNode';
import { JsonObject } from '../primitive';
import { EntityId, OperationInstance, RawOperation } from '../schema';
import { addToSet, addTypenameToDocument, isObject } from '../util';

import { QueryInfo } from './QueryInfo';

export namespace CacheContext {

  export type EntityIdForNode = (node: JsonObject) => EntityId | undefined;
  export type EntityIdMapper = (node: JsonObject) => string | number | undefined;
  export type EntityTransformer = (node: JsonObject) => void;
  export type LogEmitter = (message: string, ...metadata: any[]) => void;
  export interface Logger {
    warn: LogEmitter;
    error: LogEmitter;
  }

  /**
   * Configuration for a Hermes cache.
   */
  export interface Configuration {
    /** Whether __typename should be injected into nodes in queries. */
    addTypename?: boolean;

    /**
     * Given a node, determines a _globally unique_ identifier for it to be used
     * by the cache.
     *
     * Generally, any node that is considered to be an entity (domain object) by
     * the application should be given an id.  All entities are normalized
     * within the cache; everything else is not.
     */
    entityIdForNode?: EntityIdMapper;

    /**
     * The logger to use when emitting messages. By default, `console`.
     */
    logger?: Logger;

    /**
     * Transformation function to be run on entity nodes that change during
     * write operation; an entity node is defined by `entityIdForNode`.
     */
    entityTransformer?: EntityTransformer;

    /**
     * Whether values in the graph should be frozen.
     *
     * Defaults to true unless process.env.NODE_ENV === 'production'
     */
    freeze?: boolean;
  }

}

/**
 * Configuration and shared state used throughout the cache's operation.
 */
export class CacheContext {

  /** Retrieve the EntityId for a given node, if any. */
  readonly entityIdForNode: CacheContext.EntityIdForNode;

  /** Run transformation on changed entity node, if any. */
  readonly entityTransformer: CacheContext.EntityTransformer | undefined;

  /** Whether we should freeze snapshots after writes. */
  readonly freezeSnapshots: boolean;

  /** Whether __typename should be injected into nodes in queries. */
  private readonly _addTypename: boolean;
  /** All currently known & processed GraphQL documents. */
  private readonly _queryInfoMap = new Map<string, QueryInfo>();
  /** All currently known & parsed queries, for identity mapping. */
  private readonly _operationMap = new Map<string, OperationInstance[]>();
  /** All queries that have been successfully written to the cache. */
  private readonly _writtenQueries = new Set<OperationInstance>();
  /** The logger we should use. */
  private readonly _logger: CacheContext.Logger;


  constructor(config: CacheContext.Configuration = {}) {
    this.entityIdForNode = _makeEntityIdMapper(config.entityIdForNode);
    this.entityTransformer = config.entityTransformer;
    this.freezeSnapshots = 'freeze' in config
      ? !!config.freeze
      : lodashGet(global, 'process.env.NODE_ENV') !== 'production';

    this._addTypename = config.addTypename || false;
    this._logger = config.logger || {
      warn:  console.warn  ? console.warn.bind(console)  : console.log.bind(console), // eslint-disable-line no-console
      error: console.error ? console.error.bind(console) : console.log.bind(console), // eslint-disable-line no-console
    };
  }

  /**
   * Returns a memoized & parsed operation.
   *
   * To aid in various cache lookups, the result is memoized by all of its
   * values, and can be used as an identity for a specific operation.
   */
  parseOperation(raw: RawOperation): OperationInstance {
    // It appears like Apollo or someone upstream is cloning or otherwise
    // modifying the queries that are passed down.  Thus, the operation source
    // is a more reliable cache key…
    const cacheKey = operationCacheKey(raw.document);
    let operationInstances = this._operationMap.get(cacheKey);
    if (!operationInstances) {
      operationInstances = [];
      this._operationMap.set(cacheKey, operationInstances);
    }

    // Do we already have a copy of this guy?
    for (const instance of operationInstances) {
      if (instance.rootId !== raw.rootId) continue;
      if (!lodashIsEqual(instance.variables, raw.variables)) continue;
      return instance;
    }

    const info = this._queryInfo(raw.document);
    const fullVariables = { ...info.variableDefaults, ...raw.variables } as JsonObject;
    const operation = {
      info,
      rootId: raw.rootId,
      parsedQuery: expandVariables(info.parsed, fullVariables),
      isStatic: !areChildrenDynamic(info.parsed),
      variables: raw.variables,
      dynamicFieldMap: deprecatedExpandVariables(info.rawDynamicFieldMap, fullVariables),
    };
    operationInstances.push(operation);

    return operation;
  }

  /**
   * Emit a warning.
   */
  warn(message: string, ...metadata: any[]): void {
    this._logger.warn(message, ...metadata);
  }

  /**
   * Emit a non-blocking error.
   */
  error(message: string, ...metadata: any[]): void {
    this._logger.error(message, ...metadata);
  }

  /**
   * Mark a query as having been successfully written into the graph.
   */
  markOperationsWritten(parsed: Iterable<OperationInstance>): void {
    addToSet(this._writtenQueries, parsed);
  }

  /**
   * Whether we've previously written a query to the cache (and that reads
   * against it should be considered complete).
   *
   * Once written, it's impossible for a read of that same query to be
   * considered incomplete (we never remove reachable nodes in the graph).
   */
  wasOperationWritten(parsed: OperationInstance): boolean {
    return this._writtenQueries.has(parsed);
  }

  /**
   * Retrieves a memoized QueryInfo for a given GraphQL document.
   */
  private _queryInfo(document: DocumentNode): QueryInfo {
    const cacheKey = operationCacheKey(document);
    if (!this._queryInfoMap.has(cacheKey)) {
      if (this._addTypename) {
        document = addTypenameToDocument(document);
      }
      this._queryInfoMap.set(cacheKey, new QueryInfo(this, document));
    }
    return this._queryInfoMap.get(cacheKey)!;
  }

}

/**
 * Wrap entityIdForNode so that it coerces all values to strings.
 */
export function _makeEntityIdMapper(
  mapper: CacheContext.EntityIdMapper = defaultEntityIdMapper,
): CacheContext.EntityIdForNode {
  return function entityIdForNode(node: JsonObject) {
    if (!isObject(node)) return undefined;

    // We don't trust upstream implementations.
    const entityId = mapper(node);
    if (typeof entityId === 'string') return entityId;
    if (typeof entityId === 'number') return String(entityId);
    return undefined;
  };
}

export function defaultEntityIdMapper(node: { id?: any }) {
  return node.id;
}

export function operationCacheKey(document: DocumentNode) {
  return document.loc!.source.body;
}
