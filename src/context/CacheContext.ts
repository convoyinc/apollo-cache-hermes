
import { addTypenameToDocument, isEqual } from 'apollo-utilities';
import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies
import lodashGet = require('lodash.get');

import { ApolloTransaction } from '../apollo/Transaction';
import { areChildrenDynamic, expandVariables } from '../ParsedQueryNode';
import { JsonObject } from '../primitive';
import { EntityId, OperationInstance, RawOperation } from '../schema';
import { isObject } from '../util';

import { QueryInfo } from './QueryInfo';

export namespace CacheContext {

  export type EntityIdForNode = (node: JsonObject) => EntityId | undefined;
  export type EntityIdForValue = (value: any) => EntityId | undefined;
  export type EntityIdMapper = (node: JsonObject) => string | number | undefined;
  export type EntityTransformer = (node: JsonObject) => void;
  export type LogEmitter = (message: string, ...metadata: any[]) => void;
  export interface Logger {
    debug: LogEmitter;
    warn: LogEmitter;
    error: LogEmitter;
    group: LogEmitter;
    groupEnd: () => void;
  }

  /**
   * Expected to return an EntityId or undefined, but we loosen the restrictions
   * for ease of declaration.
   */
  export type ResolverRedirect = (args: JsonObject) => any;
  export type ResolverRedirects = {
    [typeName: string]: {
      [fieldName: string]: ResolverRedirect,
    },
  };

  /**
   * Callback that is triggered when an entity is edited within the cache.
   */
  export interface EntityUpdater {
    // TODO: It's a bit odd that this is the _only_ Apollo-specific interface
    // that we're exposing.  Do we want to keep that?  It does mirror a
    // mutation's update callback nicely.
    (dataProxy: ApolloTransaction, entity: any, previous: any): void;
  }

  export interface EntityUpdaters {
    [typeName: string]: EntityUpdater;
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
     * Whether debugging information should be logged out.
     *
     * Enabling this will cause the cache to emit log events for most operations
     * performed against it.
     */
    verbose?: boolean;

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

    /**
     * Parameterized fields that should redirect to entities in the cache when
     * there is no value currently cached for their location.
     *
     * Note that you may only redirect to _entities_ within the graph.
     * Redirection to arbitrary nodes is not supported.
     */
    resolverRedirects?: ResolverRedirects;

    /**
     * Callbacks that are triggered when entities of a given type are changed.
     *
     * These provide the opportunity to make edits to the cache based on the
     * values that were edited within entities.  For example: keeping a filtered
     * list in sync w/ the values within it.
     *
     * Note that these callbacks are called immediately before a transaction is
     * committed.  You will not see their effect _during_ a transaction.
     */
    entityUpdaters?: EntityUpdaters;
  }

}

/**
 * Configuration and shared state used throughout the cache's operation.
 */
export class CacheContext {

  /** Retrieve the EntityId for a given node, if any. */
  readonly entityIdForValue: CacheContext.EntityIdForValue;

  /** Run transformation on changed entity node, if any. */
  readonly entityTransformer: CacheContext.EntityTransformer | undefined;

  /** Whether we should freeze snapshots after writes. */
  readonly freezeSnapshots: boolean;

  /** Whether the cache should emit debug level log events. */
  readonly verbose: boolean;

  /** Configured resolver redirects. */
  readonly resolverRedirects: CacheContext.ResolverRedirects;

  /** Configured entity updaters. */
  readonly entityUpdaters: CacheContext.EntityUpdaters;

  /** Whether __typename should be injected into nodes in queries. */
  private readonly _addTypename: boolean;
  /** All currently known & processed GraphQL documents. */
  private readonly _queryInfoMap = new Map<string, QueryInfo>();
  /** All currently known & parsed queries, for identity mapping. */
  private readonly _operationMap = new Map<string, OperationInstance[]>();
  /** The logger we should use. */
  private readonly _logger: CacheContext.Logger;

  constructor(config: CacheContext.Configuration = {}) {
    this.entityIdForValue = _makeEntityIdMapper(config.entityIdForNode);
    this.entityTransformer = config.entityTransformer;
    this.freezeSnapshots = 'freeze' in config
      ? !!config.freeze
      : lodashGet(global, 'process.env.NODE_ENV') !== 'production';
    this.verbose = !!config.verbose;
    this.resolverRedirects = config.resolverRedirects || {};
    this.entityUpdaters = config.entityUpdaters || {};

    this._addTypename = config.addTypename || false;
    this._logger = config.logger || {
      debug: _makeDefaultLogger('debug'),
      warn:  _makeDefaultLogger('warn'),
      error: _makeDefaultLogger('error'),
      // Grouping:
      group: _makeDefaultLogger('group'),
      groupEnd: console.groupEnd ? console.groupEnd.bind(console) : () => {}, // eslint-disable-line no-console
    };
  }

  /**
   * Performs any transformations of operation documents.
   *
   * Cache consumers should call this on any operation document prior to calling
   * any other method in the cache.
   */
  transformDocument(document: DocumentNode): DocumentNode {
    return this._addTypename ? addTypenameToDocument(document) : document;
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
      if (!isEqual(instance.variables, raw.variables)) continue;
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
    };
    operationInstances.push(operation);

    return operation;
  }

  /**
   * Emit a debugging message.
   */
  debug(message: string, ...metadata: any[]): void {
    if (!this.verbose) return;
    this._logger.debug(`[Cache] ${message}`, ...metadata);
  }

  /**
   * Emit a warning.
   */
  warn(message: string, ...metadata: any[]): void {
    this._logger.warn(`[Cache] ${message}`, ...metadata);
  }

  /**
   * Emit a non-blocking error.
   */
  error(message: string, ...metadata: any[]): void {
    this._logger.error(`[Cache] ${message}`, ...metadata);
  }

  /**
   * Emit log events in a (collapsed) group.
   */
  logGroup(message: string, callback: () => void): void {
    this._logger.group(`[Cache] ${message}`);
    try {
      callback();
    } finally {
      this._logger.groupEnd();
    }
  }

  /**
   * Retrieves a memoized QueryInfo for a given GraphQL document.
   */
  private _queryInfo(document: DocumentNode): QueryInfo {
    const cacheKey = operationCacheKey(document);
    if (!this._queryInfoMap.has(cacheKey)) {
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
): CacheContext.EntityIdForValue {
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

function _makeDefaultLogger(level: 'debug' | 'info' | 'warn' | 'error' | 'group') {
  const method = console[level] || console.log; // eslint-disable-line no-console
  return function defaultLogger(message: string, ...args: any[]) {
    method.call(console, `[Cache] ${message}`, ...args);
  };
}
