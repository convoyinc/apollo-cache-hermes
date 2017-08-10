import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { QueryInfo } from './context';
import { EntityId } from './schema';
import { isObject } from './util';

export namespace CacheContext {

  export type EntityIdForNode = (node: any) => EntityId | undefined;
  export type EntityIdMapper = (node: object) => string | number | undefined;

  /**
   * Configuration for a Hermes cache.
   */
  export interface Configuration {
     /**
     * Given a node, determines a _globally unique_ identifier for it to be used
     * by the cache.
     *
     * Generally, any node that is considered to be an entity (domain object) by
     * the application should be given an id.  All entities are normalized
     * within the cache; everything else is not.
     */
    entityIdForNode?: EntityIdMapper;
  }

}

/**
 * Configuration and shared state used throughout the cache's operation.
 */
export class CacheContext {

  /** Retrieve the EntityId for a given node, if any. */
  readonly entityIdForNode: CacheContext.EntityIdForNode;
  /** All currently known & processed GraphQL documents. */
  private readonly _queryInfoMap = new Map<DocumentNode, QueryInfo>();

  constructor(context: CacheContext.Configuration = {}) {
    this.entityIdForNode = _makeEntityIdMapper(context.entityIdForNode);
  }

  /**
   * Retrieves a memoized QueryInfo for a given GraphQL document.
   */
  queryInfo(document: DocumentNode): QueryInfo {
    if (!this._queryInfoMap.has(document)) {
      this._queryInfoMap.set(document, new QueryInfo(document));
    }
    return this._queryInfoMap.get(document) as QueryInfo;
  }

}

/**
 * Wrap entityIdForNode so that it coerces all values to strings.
 */
export function _makeEntityIdMapper(
  mapper: CacheContext.EntityIdMapper = defaultEntityIdMapper,
): CacheContext.EntityIdForNode {
  if (!mapper) return defaultEntityIdMapper;

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
