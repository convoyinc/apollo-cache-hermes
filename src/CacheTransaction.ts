import { CacheSnapshot } from './CacheSnapshot';
import { CacheContext } from './context';
import { GraphSnapshot } from './GraphSnapshot';
import { read, write } from './operations';
import { JsonObject, JsonValue } from './primitive';
import { Queryable } from './Queryable';
import { ChangeId, NodeId, ParsedQuery, RawOperation, QuerySnapshot } from './schema';
import { addToSet } from './util';

/**
 * Collects a set of edits against a version of the cache, eventually committing
 * them in the form of a new cache snapshot.
 *
 * If a ChangeId is provided, edits will be made on top of the optimistic state
 * (an optimistic update).  Otherwise edits are made against the baseline state.
 */
export class CacheTransaction implements Queryable {

  /** The set of nodes edited throughout the transaction. */
  private _editedNodeIds = new Set<NodeId>();

  /** All edits made throughout the transaction. */
  private _deltas: QuerySnapshot[] = [];

  /** All queries written during the transaction. */
  private _writtenQueries = new Set<ParsedQuery>();

  constructor(
    private _context: CacheContext,
    private _snapshot: CacheSnapshot,
    private _optimisticChangeId?: ChangeId,
  ) {}

  /**
   * Executes reads against the current values in the transaction.
   */
  read(query: RawOperation): { result?: JsonValue, complete: boolean } {
    return read(this._context, query, this._snapshot.optimistic);
  }

  /**
   * Merges a payload with the current values in the transaction.
   *
   * If this is an optimistic transaction, edits will be made directly on top of
   * any previous optimistic values.  Otherwise, edits will be made to the
   * baseline state (and any optimistic updates will be replayed over it).
   */
  write(query: RawOperation, payload: JsonObject): void {
    if (this._optimisticChangeId) {
      this._writeOptimistic(query, payload);
    } else {
      this._writeBaseline(query, payload);
    }
  }

  /**
   * Roll back a previously enqueued optimistic update.
   */
  rollback(changeId: ChangeId): void {
    const current = this._snapshot;

    const optimisticQueue = current.optimisticQueue.remove(changeId);
    const optimistic = this._buildOptimisticSnapshot(current.baseline);

    this._snapshot = { ...current, optimistic, optimisticQueue };
  }

  /**
   * Complete the transaction, returning the new snapshot and the ids of any
   * nodes that were edited.
   */
  commit(): { snapshot: CacheSnapshot, editedNodeIds: Set<NodeId>, writtenQueries: Set<ParsedQuery> } {
    let snapshot = this._snapshot;
    if (this._optimisticChangeId) {
      snapshot = {
        ...snapshot,
        optimisticQueue: snapshot.optimisticQueue.enqueue(this._optimisticChangeId, this._deltas),
      };
    }

    return { snapshot, editedNodeIds: this._editedNodeIds, writtenQueries: this._writtenQueries };
  }

  /**
   * Merge a payload with the baseline snapshot.
   */
  private _writeBaseline(query: RawOperation, payload: JsonObject) {
    const current = this._snapshot;

    const { snapshot: baseline, editedNodeIds, writtenQueries } = write(this._context, current.baseline, query, payload);
    addToSet(this._editedNodeIds, editedNodeIds);
    addToSet(this._writtenQueries, writtenQueries);

    const optimistic = this._buildOptimisticSnapshot(baseline);

    this._snapshot = { ...current, baseline, optimistic };
  }

  /**
   * Given a baseline snapshot, build an optimistic one from it.
   */
  _buildOptimisticSnapshot(baseline: GraphSnapshot) {
    const { optimisticQueue } = this._snapshot;
    if (!optimisticQueue.hasUpdates()) return baseline;

    const { snapshot, editedNodeIds } = optimisticQueue.apply(this._context, baseline);
    addToSet(this._editedNodeIds, editedNodeIds);

    return snapshot;
  }

  /**
   * Merge a payload with the optimistic snapshot.
   */
  private _writeOptimistic(query: RawOperation, payload: JsonObject) {
    this._deltas.push({ query, payload });

    const { snapshot: optimistic, editedNodeIds, writtenQueries } = write(this._context, this._snapshot.baseline, query, payload);
    addToSet(this._writtenQueries, writtenQueries);
    addToSet(this._editedNodeIds, editedNodeIds);

    this._snapshot = { ...this._snapshot, optimistic };
  }

}
