import { PathPart } from './primitive';
import { NodeId } from './schema';

/**
 * Bookkeeping metadata and a reference to a unique node in the cached graph.
 */
export class NodeSnapshot {
  constructor(
    /** A reference to the node this snapshot is about. */
    readonly node?: any,
    /** Other node snapshots that point to this one. */
    readonly inbound?: NodeSnapshot.Reference[],
    /** The node snapshots that this one points to. */
    readonly outbound?: NodeSnapshot.Reference[],
  ) {}
}

export namespace NodeSnapshot {

  /**
   * Each node maintains a list of references to/from it, and how to find them.
   *
   * Used when updating the graph, as well as for garbage collection.
   */
  export interface Reference {
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

}
