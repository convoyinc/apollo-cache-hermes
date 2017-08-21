import { NodeSnapshot, NodeReference } from './NodeSnapshot';

/**
 * Maintains a reference to a single entity within the cached graph, and any
 * bookkeeping metadata associated with it.
 */
export class EntitySnapshot implements NodeSnapshot {
  constructor(
    /** A reference to the entity this snapshot is about. */
    readonly node?: any,
    /** Other node snapshots that point to this one. */
    readonly inbound?: NodeReference[],
    /** The node snapshots that this one points to. */
    readonly outbound?: NodeReference[],
  ) {}
}
