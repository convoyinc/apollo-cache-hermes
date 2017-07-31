import { NodeId } from './schema';

/**
 *
 */
export interface Configuration {

  /**
   *
   */
  entityIdForNode(node: any): NodeId | undefined;

}
