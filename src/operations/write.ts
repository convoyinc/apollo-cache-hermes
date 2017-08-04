import { Configuration } from '../Configuration';
import { GraphSnapshot } from '../GraphSnapshot';
import { NodeId, Query } from '../schema';

/**
 *
 */
export function write(
  config: Configuration, snapshot: GraphSnapshot, query: Query, payload: any
): { snapshot: GraphSnapshot, editedNodeIds: Set<NodeId> } {
  return write(config, snapshot, query, payload);
}
