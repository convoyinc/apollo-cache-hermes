import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import lodashIsEqual = require('lodash.isequal');

import { EntityId, ParsedQuery, Query } from '../schema';
import { addTypenameToDocument, isObject } from '../util';

import { QueryInfo } from './QueryInfo';

export namespace CacheContext {

  export type EntityIdForNode = (node: any) => EntityId | undefined;
  export type EntityIdMapper = (node: object) => string | number | undefined;
  export type EntityTransformer = (node: object, ...args: any[]) => void;
  export type LogEmitter = (message: string, ...metadata: any[]) => void;
  export interface Logger {
    warn: LogEmitter;
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
  }

}

/**
 * Configuration and shared state used throughout the cache's operation.
 */
export class CacheContext {

  /** Retrieve the EntityId for a given node, if any. */
  readonly entityIdForNode: CacheContext.EntityIdForNode;

  /** Run transformation on changed entity node, if any */
  readonly entityTransformer: CacheContext.EntityTransformer | undefined;

  /** Whether __typename should be injected into nodes in queries. */
  private readonly _addTypename: boolean;
  /** All currently known & processed GraphQL documents. */
  private readonly _queryInfoMap = new Map<string, QueryInfo>();
  /** All currently known & parsed queries, for identity mapping. */
  private readonly _parsedQueriesMap = new Map<string, ParsedQuery[]>();
  /** The logger we should use. */
  private readonly _logger: CacheContext.Logger;

  constructor(config: CacheContext.Configuration = {}) {
    this._addTypename = config.addTypename || false;
    this.entityIdForNode = _makeEntityIdMapper(config.entityIdForNode);
    this.entityTransformer = config.entityTransformer;
    this._logger = config.logger || {
      warn: console.warn ? console.warn.bind(console) : console.log.bind(console), // eslint-disable-line no-console
    };
  }

  /**
   * Returns a memoized & parsed query.
   *
   * To aid in various cache lookups, the result is memoized by all of its
   * values, and can be used as an identity for a specific query.
   */
  parseQuery(query: Query): ParsedQuery {
    // It appears like Apollo or someone upstream is cloning or otherwise
    // modifying the queries that are passed down.  Thus, the query source is a
    // more reliable cache key…
    const cacheKey = queryCacheKey(query.document);
    let parsedQueries = this._parsedQueriesMap.get(cacheKey);
    if (!parsedQueries) {
      parsedQueries = [];
      this._parsedQueriesMap.set(cacheKey, parsedQueries);
    }

    // Do we already have a copy of this guy?
    for (const parsedQuery of parsedQueries) {
      if (parsedQuery.rootId !== query.rootId) continue;
      if (!lodashIsEqual(parsedQuery.variables, query.variables)) continue;
      return parsedQuery;
    }

    // New query.
    const parsedQuery = {
      rootId: query.rootId,
      info: this._queryInfo(query.document),
      variables: query.variables,
    };
    parsedQueries.push(parsedQuery);

    return parsedQuery;
  }

  /**
   * Emit a warning.
   */
  warn(message: string, ...metadata: any[]): void {
    this._logger.warn(message, ...metadata);
  }

  /**
   * Retrieves a memoized QueryInfo for a given GraphQL document.
   */
  private _queryInfo(document: DocumentNode): QueryInfo {
    const cacheKey = queryCacheKey(document);
    if (!this._queryInfoMap.has(cacheKey)) {
      if (this._addTypename) {
        document = addTypenameToDocument(document);
      }
      this._queryInfoMap.set(cacheKey, new QueryInfo(document));
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
  return function entityIdForNode(node: any) {
    if (!isObject(node)) return undefined;

    // We don't trust upstream implementations.
    const entityId = mapper(node);
    if (typeof entityId === 'string') return entityId;
    if (typeof entityId === 'number') return String(entityId);
    return undefined;
  };
}

export function defaultEntityIdMapper(node: any) {
  return node.id;
}

export function queryCacheKey(document: DocumentNode) {
  return document.loc!.source.body;
}
