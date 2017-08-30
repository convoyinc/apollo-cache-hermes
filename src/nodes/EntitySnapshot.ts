import { JsonObject, NestedArray, NestedObject } from '../primitive';

import { NodeReference, NodeSnapshot } from './NodeSnapshot';

// Until https://github.com/Microsoft/TypeScript/issues/9944
export { NestedArray, NestedObject };

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
    public node?: JsonObject,
    /** Other node snapshots that point to this one. */
    public inbound?: NodeReference[],
    /** The node snapshots that this one points to. */
    public outbound?: NodeReference[],
  ) {}
}
