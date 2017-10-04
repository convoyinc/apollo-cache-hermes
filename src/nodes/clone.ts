import { EntitySnapshot } from './EntitySnapshot';
import { NodeSnapshot } from './NodeSnapshot';
import { ParameterizedValueSnapshot } from './ParameterizedValueSnapshot';

/**
 * Factory function for cloning nodes to their specific type signatures, while
 * preserving object shapes.
 */
export function cloneNodeSnapshot(parent: NodeSnapshot) {
  const inbound = parent.inbound ? [...parent.inbound] : undefined;
  const outbound = parent.outbound ? [...parent.outbound] : undefined;

  if (parent instanceof EntitySnapshot) {
    return new EntitySnapshot(parent.data, inbound, outbound);
  } else if (parent instanceof ParameterizedValueSnapshot) {
    return new ParameterizedValueSnapshot(parent.data, inbound, outbound);
  } else {
    throw new Error(`Unknown node type: ${Object.getPrototypeOf(parent).constructor.name}`);
  }
}
