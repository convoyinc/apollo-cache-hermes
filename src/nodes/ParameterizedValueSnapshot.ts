import { NodeSnapshot, NodeReference } from './NodeSnapshot';

/**
 * Maintains a reference to the value of a specific parameterized field
 * contained within some other node.
 *
 * These values are stored outside of the entity that contains them, as the
 * entity node is reserved for static values.  At read time, these values are
 * overlaid on top of the static values of the entity that contains them.
 */
export class ParameterizedValueSnapshot implements NodeSnapshot {
  constructor(
    /** A reference to the entity this snapshot is about. */
    public node?: any,
    /** Other node snapshots that point to this one. */
    public inbound?: NodeReference[],
    /** The node snapshots that this one points to. */
    public outbound?: NodeReference[],
  ) {}
}
