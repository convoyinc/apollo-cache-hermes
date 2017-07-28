import { EntitySnapshot } from './EntitySnapshot';
import { EntityId } from './schema';

/**
 * Maintains an identity map of all entity snapshots that reference into a
 * particular version of the graph.
 *
 * Provides an immutable view into the graph at a point in time.
 */
export class GraphSnapshot {

  /**
   * @internal
   */
  constructor(
    // TODO(nevir): Profile Object.create(null) vs Map.
    private _entities = new Map<string, EntitySnapshot>(),
  ) {}

  /**
   * Retrieves the entity identified by `id`.
   */
  get(id: EntityId): object | undefined {
    const snapshot = this.getSnapshot(id);
    return snapshot ? snapshot.entity : undefined;
  }

  /**
   * Returns whether `id` exists as an entity in the graph.
   */
  has(id: EntityId): boolean {
    return this._entities.has(id);
  }

  /**
   * Retrieves the snapshot for the entity identified by `id`.
   *
   * @internal
   */
  getSnapshot(id: EntityId): EntitySnapshot | undefined {
    return this._entities.get(id);
  }

}
