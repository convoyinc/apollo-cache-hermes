import { NodeReference, NodeSnapshot } from './NodeSnapshot';

/**
 * Maintains a reference to a single entity within the cached graph, and any
 * bookkeeping metadata associated with it.
 * 
 * Note that this houses all the _static_ values for an entity, but none of the
 * parameterized values that may also have been queried for it.
 */
export class EntitySnapshot implements NodeSnapshot {
  constructor(
    /** A reference to the entity this snapshot is about. */
    public node?: any,
    /** Other node snapshots that point to this one. */
    public inbound?: NodeReference[],
    /** The node snapshots that this one points to. */
    public outbound?: NodeReference[],
  ) {}
}
