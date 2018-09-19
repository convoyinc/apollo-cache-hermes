import { CacheContext } from './context';
import { DeepReadonly, JsonScalar, JsonObject, JsonValue, NestedObject, NestedValue } from './primitive';
import { FragmentMap, SelectionSetNode } from './util';
export declare type JsonAndVariables = JsonScalar | VariableArgument;
export declare type FieldArguments<TArgTypes = JsonScalar> = NestedObject<TArgTypes>;
/**
 * The GraphQL AST is parsed down into a simple tree containing all information
 * the cache requires to read/write associated payloads.
 *
 * A parsed query has no notion of fragments, or other such redirections; they
 * are flattened into query nodes when parsed.
 */
export declare class ParsedQueryNode<TArgTypes = JsonScalar> {
    /** Any child fields. */
    children: ParsedQueryNodeMap<TArgTypes> | undefined;
    /**
     * The name of the field (as defined by the schema).
     *
     * Omitted by default (can be inferred by its key in a node map), unless
     * the field is aliased.
     */
    schemaName: string | undefined;
    /** The map of the field's arguments and their values, if parameterized. */
    args: NestedObject<TArgTypes> | undefined;
    /**
     * Whether a (transitive) child contains arguments.  This allows us to
     * ignore whole subtrees in some situations if they were completely static.
     * */
    hasParameterizedChildren: boolean | undefined;
    constructor(
        /** Any child fields. */
        children?: ParsedQueryNodeMap<TArgTypes> | undefined, 
        /**
         * The name of the field (as defined by the schema).
         *
         * Omitted by default (can be inferred by its key in a node map), unless
         * the field is aliased.
         */
        schemaName?: string | undefined, 
        /** The map of the field's arguments and their values, if parameterized. */
        args?: NestedObject<TArgTypes> | undefined, 
        /**
         * Whether a (transitive) child contains arguments.  This allows us to
         * ignore whole subtrees in some situations if they were completely static.
         * */
        hasParameterizedChildren?: boolean | undefined);
}
/**
 * A ParsedQueryNode that is known to have arguments.
 */
export interface ParsedQueryNodeWithArgs<TArgTypes = JsonScalar> extends ParsedQueryNode<TArgTypes> {
    args: NestedObject<TArgTypes>;
}
/**
 * Child nodes are expressed as a map of field names (as defined by the query)
 * mapped to their metadata.
 */
export interface ParsedQueryNodeMap<TArgTypes> {
    [key: string]: ParsedQueryNode<TArgTypes>;
}
/**
 * A parsed query is simply a map of top level fields and their descendants.
 */
export interface ParsedQuery<TArgTypes = JsonScalar> extends ParsedQueryNodeMap<TArgTypes> {
}
/**
 * When we first parse a query, VariableArgument placeholders can exist in node
 * args.
 *
 * Queries given to the cache to read/write payloads must have values
 * substituted for any VariableArguments in the parsed query (and are a plain
 * ParsedQueryNode).
 */
export interface ParsedQueryWithVariables extends ParsedQuery<JsonAndVariables> {
}
/**
 * Represents the location a variable should be used as an argument to a
 * parameterized field.
 *
 * Note that variables can occur _anywhere_ within an argument, not just at the
 * top level.
 */
export declare class VariableArgument {
    /** The name of the variable. */
    readonly name: string;
    constructor(
        /** The name of the variable. */
        name: string);
}
/**
 * Parsed a GraphQL AST selection into a tree of ParsedQueryNode instances.
 */
export declare function parseQuery(context: CacheContext, fragments: FragmentMap, selectionSet: SelectionSetNode): {
    parsedQuery: DeepReadonly<ParsedQueryWithVariables>;
    variables: Set<string>;
};
/**
 * Well, are they?
 */
export declare function areChildrenDynamic(children?: ParsedQueryWithVariables): true | undefined;
/**
 * Replace all instances of VariableArgument contained within a parsed operation
 * with their actual values.
 *
 * This requires that all variables used are provided in `variables`.
 */
export declare function expandVariables(parsed: ParsedQueryWithVariables, variables: JsonObject | undefined): ParsedQuery;
export declare function _expandVariables(parsed?: ParsedQueryWithVariables, variables?: JsonObject): {} | undefined;
/**
 * Sub values in for any variables required by a field's args.
 */
export declare function expandFieldArguments(args: NestedValue<JsonAndVariables> | undefined, variables: JsonObject | undefined): JsonObject | undefined;
export declare function _expandArgument(arg: NestedValue<JsonAndVariables>, variables: JsonObject | undefined): JsonValue;
