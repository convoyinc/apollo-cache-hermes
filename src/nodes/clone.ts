import { JsonObject } from '../primitive';
import { isObject } from '../util';

import { EntitySnapshot } from './EntitySnapshot';
import { NodeSnapshot } from './NodeSnapshot';
import { ParameterizedValueSnapshot } from './ParameterizedValueSnapshot';

/**
 * Factory function for cloning nodes to their specific type signatures, while
 * preserving object shapes.
 */
export function cloneNodeSnapshot(parent: NodeSnapshot) {
  let node;
  if (Array.isArray(parent.data)) {
    node = [...parent.data];
  } else if (isObject(parent.data)) {
    node = { ...parent.data };
  } else {
    node = parent.data;
  }
  const inbound = parent.inbound ? [...parent.inbound] : undefined;
  const outbound = parent.outbound ? [...parent.outbound] : undefined;

  if (parent instanceof EntitySnapshot) {
    return new EntitySnapshot(node as JsonObject, inbound, outbound);
  } else if (parent instanceof ParameterizedValueSnapshot) {
    return new ParameterizedValueSnapshot(node, inbound, outbound);
  } else {
    throw new Error(`Unknown node type: ${Object.getPrototypeOf(parent).constructor.name}`);
  }
}
