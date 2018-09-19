import { ParsedQueryWithVariables } from '../ParsedQueryNode';
import { JsonValue } from '../primitive';
import { RawOperation } from '../schema';
import { DocumentNode, OperationDefinitionNode, OperationTypeNode, FragmentMap } from '../util';
import { CacheContext } from './CacheContext';
/**
 * Metadata about a GraphQL document (query/mutation/fragment/etc).
 *
 * We do a fair bit of pre-processing over them, and these objects hang onto
 * that information.
 */
export declare class QueryInfo {
    /** The original document (after __typename fields are injected). */
    readonly document: DocumentNode;
    /** The primary operation in the document. */
    readonly operation: OperationDefinitionNode;
    /** The type of operation. */
    readonly operationType: OperationTypeNode;
    /** The name of the operation. */
    readonly operationName?: string;
    /** The GQL source of the operation */
    readonly operationSource?: string;
    /** All fragments in the document, indexed by name. */
    readonly fragmentMap: FragmentMap;
    /**
     * The fully parsed query document.  It will be flattened (no fragments),
     * and contain placeholders for any variables in use.
     */
    readonly parsed: ParsedQueryWithVariables;
    /** Variables used within this query. */
    readonly variables: Set<string>;
    /**
     * Default values for the variables used by this query.
     *
     * Variables not present in this map are considered required.
     */
    readonly variableDefaults: {
        [Key: string]: JsonValue;
    };
    constructor(context: CacheContext, raw: RawOperation);
    private _assertValid();
    private _assertAllVariablesDeclared(messages, declaredVariables);
    private _assertAllVariablesUsed(messages, declaredVariables);
}
