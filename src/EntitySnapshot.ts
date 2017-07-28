import { PathPart } from './primitive';
import { ChangeId, EntityId } from './schema';

export namespace EntitySnapshot {
  /**
   * Each entity maintains a list of references to it, and how to find them.
   *
   * Used when updating the graph, as well as for garbage collection.
   */
  export interface InboundReference {
    /**
     * Id of the entity that contains the reference.
     */
    source: EntityId
    /**
     * The path (object/array keys) within the entity to the reference.
     */
    path: PathPart[],
  }
}

/**
 * Bookkeeping metadata and a reference to a unique entity in the cached graph.
 */
export class EntitySnapshot {
  constructor(
    /**
     * A reference to the entity this snapshot is about.
     */
    public readonly entity: object,

    /**
     * Whether this entity is considered a root of the graph.
     *
     * Roots, and the entities they transitively reference, are not garbage
     * collected.
     */
    public readonly root?: true,

    /**
     * Other entities that point to this one.
     */
    public readonly inboundReferences?: EntitySnapshot.InboundReference[],

    /**
     * The change this snapshot is associated with.
     */
    public readonly changeId?: ChangeId,

    /**
     * All snapshots this one is based off of, with immediate parent first.
     */
    public readonly ancestors?: EntitySnapshot[],
  ) {}
}
