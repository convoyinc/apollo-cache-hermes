import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { JsonObject } from '../primitive';
import { NodeId, OperationInstance, RawOperation } from '../schema';
export interface QueryResult {
    /** The value of the root requested by a query. */
    result?: JsonObject;
    /** Whether the query's selection set was satisfied. */
    complete: boolean;
}
export interface QueryResultWithNodeIds extends QueryResult {
    /** The ids of nodes selected by the query (if requested). */
    nodeIds: Set<NodeId>;
}
/**
 * Get you some data.
 */
export declare function read(context: CacheContext, raw: RawOperation, snapshot: GraphSnapshot): QueryResult;
export declare function read(context: CacheContext, raw: RawOperation, snapshot: GraphSnapshot, includeNodeIds: true): QueryResultWithNodeIds;
/**
 * Walks a parameterized field map, overlaying values at those paths on top of
 * existing results.
 *
 * Overlaid values are objects with prototypes pointing to the original results,
 * and new properties pointing to the parameterized values (or objects that
 * contain them).
 */
export declare function _walkAndOverlayDynamicValues(query: OperationInstance, context: CacheContext, snapshot: GraphSnapshot, result: JsonObject | undefined): JsonObject | undefined;
/**
 * Determines whether `result` satisfies the properties requested by
 * `selection`.
 */
export declare function _visitSelection(query: OperationInstance, context: CacheContext, result?: JsonObject, includeNodeIds?: true): {
    complete: boolean;
    nodeIds?: Set<NodeId>;
};
