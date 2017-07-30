import { PathPart } from './primitive';
import { NodeId } from './schema';

/**
 * Bookkeeping metadata and a reference to a unique value in the cached graph.
 */
export interface NodeSnapshot {
  /**
   * A reference to the value this snapshot is about.
   */
  readonly node: any,

  /**
   * Other value snapshots that point to this one.
   */
  readonly inboundReferences?: ValueSnapshot.InboundReference[];
}

export namespace ValueSnapshot {

  /**
   * Each value maintains a list of references to it, and how to find them.
   *
   * Used when updating the graph, as well as for garbage collection.
   */
  export interface InboundReference {
    /**
     * Id of the value that contains the reference.
     */
    source: NodeId,

    /**
     * The path (object/array keys) within the value to the reference.
     */
    path: PathPart[],
  }

  // Specializations.

  /**
   * A value snapshot that tracks one of the application's domain (business)
   * objects.
   */
  export class Entity implements NodeSnapshot {

    constructor(
      /**
       * A reference to the value this snapshot is about.
       */
      public readonly node: object,

      /**
       * Whether this value is considered a root of the graph.
       *
       * Roots, and the values they transitively reference, are not garbage
       * collected.
       */
      public readonly root?: true,

      /**
       * Other value snapshots that point to this one.
       */
      public readonly inboundReferences?: InboundReference[],

      /**
       * Pointers to the parameterized values that are contained within this
       * value.
       */
      public readonly parameterizedValueIds?: NodeId[],
    ) {}

  }

  /**
   * A value snapshot that tracks the value of a parameterized edge, relative to
   * a domain object.
   *
   * It is expected that the
   */
  export class ParameterizedValue implements NodeSnapshot {

    constructor(
      /**
       * The value of a parameterized edge within a domain object.
       */
      public readonly node: any,

      /**
       * The specific arguments associated with the value.
       *
       * But let's call 'em "parameters", just to reduce the number of terms you
       * need to juggle…
       */
      public readonly parameters: object,

      /**
       * There is only ever one inbound edge for the parameterized value: the
       * domain object that contains it.
       *
       * This reference is used to identify where in the domain object the value
       * is placed (when reading from the cache), as well as to inform the
       * reference counting algorithm when to clean this snapshot up.
       */
      public readonly inboundReferences: [InboundReference],
    ) {}

  }

}
