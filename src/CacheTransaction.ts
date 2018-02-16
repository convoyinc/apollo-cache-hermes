import { ApolloTransaction } from './apollo/Transaction';
import { CacheSnapshot } from './CacheSnapshot';
import { CacheContext } from './context';
import { GraphSnapshot } from './GraphSnapshot';
import { EntitySnapshot, NodeSnapshot } from './nodes';
import { read, write } from './operations';
import { JsonObject, JsonValue } from './primitive';
import { Queryable } from './Queryable';
import { ChangeId, NodeId, OperationInstance, QuerySnapshot, RawOperation, StaticNodeId } from './schema';
import { DocumentNode, addToSet, isObject } from './util';

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
  private _writtenQueries = new Set<OperationInstance>();

  /** The original snapshot before the transaction began. */
  private _parentSnapshot: CacheSnapshot;

  constructor(
    private _context: CacheContext,
    private _snapshot: CacheSnapshot,
    private _optimisticChangeId?: ChangeId,
  ) {
    this._parentSnapshot = _snapshot;
  }

  isOptimisticTransaction(): true | undefined {
    return this._optimisticChangeId ? true : undefined;
  }

  transformDocument(document: DocumentNode): DocumentNode {
    return this._context.transformDocument(document);
  }

  /**
   * Executes reads against the current values in the transaction.
   */
  read(query: RawOperation): { result?: JsonValue, complete: boolean } {
    return read(
      this._context,
      query,
      this._optimisticChangeId ? this._snapshot.optimistic : this._snapshot.baseline
    );
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

    this._snapshot = new CacheSnapshot(current.baseline, optimistic, optimisticQueue);
  }

  /**
   * Removes values from the current transaction
   */
  // eslint-disable-next-line class-methods-use-this
  evict(_query: RawOperation): { success: boolean } {
    throw new Error('evict() is not implemented on CacheTransaction');
  }

  /**
   * Complete the transaction, returning the new snapshot and the ids of any
   * nodes that were edited.
   */
  commit(): { snapshot: CacheSnapshot, editedNodeIds: Set<NodeId>, writtenQueries: Set<OperationInstance> } {
    this._triggerEntityUpdaters();

    let snapshot = this._snapshot;
    if (this._optimisticChangeId) {
      snapshot = new CacheSnapshot(
        snapshot.baseline,
        snapshot.optimistic,
        snapshot.optimisticQueue.enqueue(this._optimisticChangeId, this._deltas),
      );
    }

    return { snapshot, editedNodeIds: this._editedNodeIds, writtenQueries: this._writtenQueries };
  }

  getPreviousNodeSnapshot(nodeId: NodeId): NodeSnapshot | undefined {
    const prevSnapshot = this._optimisticChangeId ? this._parentSnapshot.optimistic : this._parentSnapshot.baseline;
    return prevSnapshot.getNodeSnapshot(nodeId);
  }

  getCurrentNodeSnapshot(nodeId: NodeId): NodeSnapshot | undefined {
    const currentSnapshot = this._optimisticChangeId ? this._snapshot.optimistic : this._snapshot.baseline;
    return currentSnapshot.getNodeSnapshot(nodeId);
  }

  /**
   * Emits change events for any callbacks configured via
   * CacheContext#entityUpdaters.
   */
  private _triggerEntityUpdaters() {
    const { entityUpdaters } = this._context;
    if (!Object.keys(entityUpdaters).length) return;

    // Capture a static set of nodes, as the updaters may add to _editedNodeIds.
    const nodesToEmit = [];
    for (const nodeId of this._editedNodeIds) {
      const node = this.getCurrentNodeSnapshot(nodeId);
      const previous = this.getPreviousNodeSnapshot(nodeId);
      // One of them may be undefined; but we are guaranteed that both represent
      // the same entity.
      const either = node || previous;

      if (!(either instanceof EntitySnapshot)) continue; // Only entities
      let typeName = isObject(either.data) && either.data.__typename as string | undefined;
      if (!typeName && nodeId === StaticNodeId.QueryRoot) {
        typeName = 'Query';
      }
      if (!typeName) continue; // Must have a typename for now.

      const updater = entityUpdaters[typeName];
      if (!updater) continue;

      nodesToEmit.push({
        updater,
        node: node && node.data,
        previous: previous && previous.data,
      });
    }

    if (!nodesToEmit.length) return;

    // TODO: This is weirdly the only place where we assume an Apollo interface.
    // Can we clean this up? :(
    const dataProxy = new ApolloTransaction(this);
    for (const { updater, node, previous } of nodesToEmit) {
      updater(dataProxy, node, previous);
    }
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

    this._snapshot = new CacheSnapshot(baseline, optimistic, current.optimisticQueue);
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

    const { snapshot: optimistic, editedNodeIds, writtenQueries } = write(this._context, this._snapshot.optimistic, query, payload);
    addToSet(this._writtenQueries, writtenQueries);
    addToSet(this._editedNodeIds, editedNodeIds);

    this._snapshot = new CacheSnapshot(this._snapshot.baseline, optimistic, this._snapshot.optimisticQueue);
  }

}
