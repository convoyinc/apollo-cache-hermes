import { JsonValue, NestedArray, NestedObject } from '../primitive';
import { NodeId } from '../schema';

import { NodeReference, NodeSnapshot } from './NodeSnapshot';

// Until https://github.com/Microsoft/TypeScript/issues/9944
export { NestedArray, NestedObject };

/**
 * Maintains a reference to the value of a specific parameterized field
 * contained within some other node.
 *
 * These values are stored outside of the entity that contains them, as the
 * entity node is reserved for static values.  At read time, these values are
 * overlaid on top of the static values of the entity that contains them.
 */
export class ParameterizedValueSnapshot implements NodeSnapshot {
  inbound?: Map<NodeId, NodeReference>;
  outbound?: Map<NodeId, NodeReference>;

  constructor(
    /** A reference to the entity this snapshot is about. */
    public data?: JsonValue,
    /** Other node snapshots that point to this one. */
    inbound?: NodeReference[],
    /** The node snapshots that this one points to. */
    outbound?: NodeReference[],
  ) {
    if (inbound) {
      this.inbound = new Map();
      for (const reference of inbound) {
        this.inbound.set(reference.id, reference);
      }
    }

    if (outbound) {
      this.outbound = new Map();
      for (const reference of outbound) {
        this.outbound.set(reference.id, reference);
      }
    }
  }
}
