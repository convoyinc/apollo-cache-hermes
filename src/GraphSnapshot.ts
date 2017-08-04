import { NodeSnapshot } from './NodeSnapshot';
import { NodeId } from './schema';

/**
 * Maintains an identity map of all value snapshots that reference into a
 * particular version of the graph.
 *
 * Provides an immutable view into the graph at a point in time.
 */
export class GraphSnapshot {

  /**
   * @internal
   */
  constructor(
    // TODO: Profile Object.create(null) vs Map.
    private _values = Object.create(null) as { [Key in NodeId]: NodeSnapshot },
  ) {}

  /**
   * Retrieves the value identified by `id`.
   */
  get(id: NodeId): any | undefined {
    const snapshot = this.getSnapshot(id);
    return snapshot ? snapshot.node : undefined;
  }

  /**
   * Returns whether `id` exists as an value in the graph.
   */
  has(id: NodeId): boolean {
    return id in this._values;
  }

  /**
   * Retrieves the snapshot for the value identified by `id`.
   *
   * @internal
   */
  getSnapshot(id: NodeId): NodeSnapshot | undefined {
    return this._values[id];
  }

  /**
   * Returns the set of ids present in the snapshot.
   *
   * @internal
   */
  allNodeIds(): NodeId[] {
    return Object.keys(this);
  }

}
