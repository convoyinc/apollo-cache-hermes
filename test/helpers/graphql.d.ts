import { JsonObject } from '../../src/primitive';
import { NodeId, RawOperation } from '../../src/schema';
/**
 * Constructs a Query from a gql document.
 */
export declare function query(gqlString: string, variables?: JsonObject, rootId?: NodeId): RawOperation;
