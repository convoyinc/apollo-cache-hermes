import { NestedArray, NestedObject } from '../primitive';
import { NodeReference, NodeSnapshot } from './NodeSnapshot';
export { NestedArray, NestedObject };
/**
 * Maintains a reference to a single entity within the cached graph, and any
 * bookkeeping metadata associated with it.
 *
 * Note that this houses all the _static_ values for an entity, but none of the
 * parameterized values that may also have been queried for it.
 */
export declare class EntitySnapshot implements NodeSnapshot {
    /** A reference to the entity this snapshot is about. */
    data: NestedObject<string | number | boolean | null> | undefined;
    /** Other node snapshots that point to this one. */
    inbound: NodeReference[] | undefined;
    /** The node snapshots that this one points to. */
    outbound: NodeReference[] | undefined;
    constructor(
        /** A reference to the entity this snapshot is about. */
        data?: NestedObject<string | number | boolean | null> | undefined, 
        /** Other node snapshots that point to this one. */
        inbound?: NodeReference[] | undefined, 
        /** The node snapshots that this one points to. */
        outbound?: NodeReference[] | undefined);
}
