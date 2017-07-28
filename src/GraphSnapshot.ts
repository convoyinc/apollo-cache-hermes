import { EntityId } from './schema';
import { EntitySnapshot } from './EntitySnapshot';

/**
 * Maintains an identity map of all entity snapshots that reference into a
 * particular version of the graph.
 *
 * Provides an immutable view into the graph at a point in time.
 */
export class GraphSnapshot {

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
    return false; // TODO(nevir): Port over.
  }

  /**
   * Retrieves the snapshot for the entity identified by `id`.
   *
   * @internal
   */
  getSnapshot(id: EntityId): EntitySnapshot | undefined {
    return; // TODO(nevir): Port over.
  }

}
