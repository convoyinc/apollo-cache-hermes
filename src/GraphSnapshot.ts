import deepFreeze = require('deep-freeze-strict');

import { NodeSnapshot } from './nodes';
import { QueryResult, QueryResultWithNodeIds } from './operations/read';
import { NodeId, OperationInstance } from './schema';

export type NodeSnapshotMap = { [Key in NodeId]: NodeSnapshot; };
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
  public readonly readCache = new Map<OperationInstance<GraphSnapshot>, QueryResult | QueryResultWithNodeIds>();

  /**
   * @internal
   */
  constructor(
    // TODO: Profile Object.create(null) vs Map.
    public _values: NodeSnapshotMap = Object.create(null),
  ) {}

  /**
   * Retrieves the value identified by `id`.
   */
  getNodeData(id: NodeId): any {
    const snapshot = this.getNodeSnapshot(id);
    return snapshot ? snapshot.data : undefined;
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
  getNodeSnapshot(id: NodeId): Readonly<NodeSnapshot> | undefined {
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

  /**
   * Freezes the snapshot (generally for development mode)
   *
   * @internal
   */
  freeze(): void {
    deepFreeze(this._values);
  }

}
