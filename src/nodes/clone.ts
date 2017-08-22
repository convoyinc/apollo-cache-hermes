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
  if (Array.isArray(parent.node)) {
    node = [...parent.node];
  } else if (isObject(parent.node)) {
    node = { ...parent.node };
  } else {
    node = parent.node;
  }
  const inbound = parent && parent.inbound ? [...parent.inbound] : undefined;
  const outbound = parent && parent.outbound ? [...parent.outbound] : undefined;

  const NodeSnapshotClass = Object.getPrototypeOf(parent).constructor;
  switch (NodeSnapshotClass) {
  case EntitySnapshot:
    return new EntitySnapshot(node, inbound, outbound);
  case ParameterizedValueSnapshot:
    return new ParameterizedValueSnapshot(node, inbound, outbound);
  default:
    throw new Error(`Unknown node type: ${NodeSnapshotClass.name}`);
  }
}
