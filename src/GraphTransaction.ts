import { EntitySnapshot } from './EntitySnapshot';
import { GraphSnapshot } from './GraphSnapshot';
import { ChangeId, EntityId } from './schema';

/**
 * Builds a set of changes to apply on top of an existing `GraphSnapshot`.
 *
 * Performs the minimal set of edits to generate new immutable versions of each
 * entity, while preserving immutability of the parent snapshot.
 */
export class GraphTransaction {

  private _newEntities = new Map<string, EntitySnapshot>();

  constructor(
    /** The snapshot to base edits off of. */
    private _parent: GraphSnapshot,
    /** A unique id to tag this transaction with. */
    private _changeId?: ChangeId,
  ) {}

  /**
   * Merge a GraphQL payload (query/fragment/etc) into the snapshot, rooted at
   * the entity identified by `rootId`.
   */
  mergePayload(rootId: EntityId, payload: object): void {
    // TODO(nevir): Port over.
    if (this._changeId) { // Random conditional to get TS to shut up.
      this._newEntities.set(rootId, new EntitySnapshot(payload, true));
    }
  }

  /**
   * Reverts all changes that were introduced by `changeId`.
   */
  revertChange(changeId: ChangeId): void {
    this._newEntities.get(changeId); // TODO(nevir): Port over.
  }

  /**
   * Retrieves the entity identified by `id`.
   */
  get(id: EntityId): object | undefined {
    // TODO(nevir): Port over.
    const snapshot = this.getSnapshot(id);
    return snapshot ? snapshot.entity : undefined;
  }

  /**
   * Returns whether `id` exists as an entity in the graph.
   */
  has(id: EntityId): boolean {
    return this._parent.has(id); // TODO(nevir): Port over.
  }

  /**
   * Commits the transaction, returning a new immutable snapshot.
   */
  commit(): GraphSnapshot {
    return new GraphSnapshot(this._newEntities); // TODO(nevir): Port over.
  }

  /**
   * Retrieves the snapshot for the entity identified by `id`.
   *
   * @internal
   */
  getSnapshot(id: EntityId): EntitySnapshot | undefined {
    return this._parent.getSnapshot(id); // TODO(nevir): Port over.
  }

}
