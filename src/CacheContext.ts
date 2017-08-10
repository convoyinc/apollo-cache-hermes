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

  readonly entityIdForNode: CacheContext.EntityIdForNode;

  constructor(context: CacheContext.Configuration = {}) {
    this.entityIdForNode = _makeEntityIdMapper(context.entityIdForNode);
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
