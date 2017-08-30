import { JsonValue, PathPart } from '../primitive';
import { NodeId } from '../schema';

/**
 * Common values and bookkeeping for all node snapshots.
 */
export interface NodeSnapshot {
  /** A reference to the node this snapshot is about. TODO: Remove? */
  node?: JsonValue;
  /** Other node snapshots that point to this one. */
  inbound?: NodeReference[];
  /** The node snapshots that this one points to. */
  outbound?: NodeReference[];
}

/**
 * Each node maintains a list of references to/from it, and how to find them.
 *
 * Used when updating the graph, as well as for garbage collection.
 */
export interface NodeReference {
  /**
   * Id of the node that is either doing the referencing (inbound), or being
   * referenced (outbound).
   */
  id: NodeId;

  /**
   * The path (object/array keys) within the node to the reference.
   *
   * If the path is omitted, this reference is used purely for garbage
   * collection, but is not walked when regenerating node references.
   */
  path?: PathPart[];
}
