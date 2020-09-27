import { JsonValue, PathPart } from '../primitive';
import { NodeId } from '../schema';

/**
 * Common values and bookkeeping for all node snapshots.
 */
export interface NodeSnapshot {
  /** A reference to the node this snapshot is about. TODO: Remove? */
  data?: JsonValue;
  /** Other node snapshots that point to this one. */
  inbound?: Map<NodeId, NodeReference>;
  /** The node snapshots that this one points to. */
  outbound?: Map<NodeId, NodeReference>;
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
   */
  path: PathPart[];
}
