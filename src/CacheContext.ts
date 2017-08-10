import { EntityId } from './schema';

export namespace CacheContext {

  export type EntityIdForNode = (node: any) => EntityId | undefined;

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
    entityIdForNode: (node: any) => string | number | undefined;
  }

}

/**
 * Configuration and shared state used throughout the cache's operation.
 */
export class CacheContext {

  readonly entityIdForNode: CacheContext.EntityIdForNode;

  constructor(config: CacheContext.Configuration) {
    this.entityIdForNode = _makeEntityIdForNodeMapper(config.entityIdForNode);
  }

}

/**
 * Wrap entityIdForNode so that it coerces all values to strings.
 */
export function _makeEntityIdForNodeMapper(mapper: (node: any) => string | number | undefined): CacheContext.EntityIdForNode {
  return function entityIdForNode(node: any) {
    const entityId = mapper(node);
    if (entityId === undefined || typeof entityId === 'string') return entityId;
    return String(entityId);
  };
}
