import { PathPart } from './primitive';
import { NodeId } from './schema';

/**
 * Bookkeeping metadata and a reference to a unique node in the cached graph.
 */
export interface NodeSnapshot {
  /** A reference to the node this snapshot is about. */
  readonly node: any,
  /** Other node snapshots that point to this one. */
  readonly inbound?: ValueSnapshot.NodeReference[];
  /** The node snapshots that this one points to. */
  readonly outbound?: ValueSnapshot.NodeReference[];
}

export namespace ValueSnapshot {

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
    id: NodeId,

    /**
     * The path (object/array keys) within the node to the reference.
     */
    path: PathPart[],
  }

  // Specializations.

  /**
   * A node snapshot that tracks one of the application's domain (business)
   * objects.
   */
  export class Entity implements NodeSnapshot {

    constructor(
      /**
       * A reference to the node this snapshot is about.
       */
      public readonly node: object,

      /**
       * Other node snapshots that point to this one.
       */
      public readonly inbound?: NodeReference[],

      /**
       * The node snapshots that this one points to.
       */
      readonly outbound?: ValueSnapshot.NodeReference[],

      /**
       * Whether this node is considered a root of the graph.
       *
       * Roots, and the nodes they transitively reference, are not garbage
       * collected.
       */
      public readonly root?: true,
    ) {}

  }

  /**
   * A node snapshot that tracks the node of a parameterized edge, relative to
   * a domain object.
   *
   * It is expected that the
   */
  export class ParameterizedValue implements NodeSnapshot {

    constructor(
      /**
       * The node of a parameterized edge within a domain object.
       */
      public readonly node: any,

      /**
       * The specific arguments associated with the node.
       *
       * TODO: Do we need this?  If not, consider folding the types together.
       *
       * But let's call 'em "parameters", just to reduce the number of terms you
       * need to juggle…
       */
      public readonly parameters: object,

      /**
       * There is only ever one inbound edge for the parameterized node: the
       * domain object that contains it.
       *
       * This reference is used to identify where in the domain object the node
       * is placed (when reading from the cache), as well as to inform the
       * reference counting algorithm when to clean this snapshot up.
       */
      public readonly inbound: [NodeReference],

      /**
       * The node snapshots that this one points to.
       */
      readonly outbound?: ValueSnapshot.NodeReference[],
    ) {}

  }

}
