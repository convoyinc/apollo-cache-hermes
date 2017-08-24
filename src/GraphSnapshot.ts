import { NodeSnapshot } from './nodes';
import { QueryResult, QueryResultWithNodeIds } from './operations/read';
import { NodeId, ParsedQuery } from './schema';

/**
 * Maintains an identity map of all value snapshots that reference into a
 * particular version of the graph.
 *
 * Provides an immutable view into the graph at a point in time.
 *
 * Also provides a place to hang per-snapshot caches off of.
 */
export class GraphSnapshot {

  /** Cached results for queries. */
  public readonly readCache = new Map<ParsedQuery, QueryResult | QueryResultWithNodeIds>();

  /**
   * @internal
   */
  constructor(
    // TODO: Profile Object.create(null) vs Map.
    public _values: { [Key in NodeId]: NodeSnapshot; } = Object.create(null),
  ) {}

  /**
   * Retrieves the value identified by `id`.
   */
<<<<<<< HEAD
  get(id: NodeId): Readonly<any> | undefined {
=======
  get(id: NodeId): any | undefined {
>>>>>>> Address PR: rename getGraphNodeSnapshot
    const snapshot = this.getNodeSnapshot(id);
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
<<<<<<< HEAD
  getNodeSnapshot(id: NodeId): Readonly<NodeSnapshot> | undefined {
=======
  getNodeSnapshot(id: NodeId): NodeSnapshot | undefined {
>>>>>>> Address PR: rename getGraphNodeSnapshot
    return this._values[id];
  }

  /**
   * Returns the set of ids present in the snapshot.
   *
   * @internal
   */
  allNodeIds(): NodeId[] {
    return Object.keys(this._values);
  }

}
