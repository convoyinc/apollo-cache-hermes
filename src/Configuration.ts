import { NodeId } from './schema';

/**
 * Configuration used throughout the cache's operation.
 */
export interface Configuration {

  /**
   * Given a node, determines a _globally unique_ identifier for it to be used
   * by the cache.
   *
   * Generally, any node that is considered to be an entity (domain object) by
   * the application should be given an id.  All entities are normalized within
   * the cache; everything else is not.
   */
  entityIdForNode(node: any): NodeId | undefined;

}
