import { JsonObject } from '../primitive';
import { NodeId, RawOperation } from '../schema';
import { DocumentNode } from '../util';
/**
 * Builds a query.
 */
export declare function buildRawOperationFromQuery(document: DocumentNode, variables?: JsonObject, rootId?: NodeId): RawOperation;
export declare function buildRawOperationFromFragment(fragmentDocument: DocumentNode, rootId: NodeId, variables?: JsonObject, fragmentName?: string): RawOperation;
