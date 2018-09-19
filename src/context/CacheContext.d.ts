import { ApolloTransaction } from '../apollo/Transaction';
import { CacheSnapshot } from '../CacheSnapshot';
import { JsonObject } from '../primitive';
import { EntityId, OperationInstance, RawOperation } from '../schema';
import { DocumentNode } from '../util';
import { ConsoleTracer } from './ConsoleTracer';
import { Tracer } from './Tracer';
declare module 'graphql/language/ast' {
    interface DocumentNode {
        /** Indicating that query has already ran transformDocument */
        hasBeenTransformed?: boolean;
    }
}
export declare namespace CacheContext {
    type EntityIdForNode = (node: JsonObject) => EntityId | undefined;
    type EntityIdForValue = (value: any) => EntityId | undefined;
    type EntityIdMapper = (node: JsonObject) => string | number | undefined;
    type EntityTransformer = (node: JsonObject) => void;
    type OnChangeCallback = (newCacheShapshot: CacheSnapshot, editedNodeIds: Set<String>) => void;
    /**
     * Expected to return an EntityId or undefined, but we loosen the restrictions
     * for ease of declaration.
     */
    type ResolverRedirect = (args: JsonObject) => any;
    type ResolverRedirects = {
        [typeName: string]: {
            [fieldName: string]: ResolverRedirect;
        };
    };
    /**
     * Callback that is triggered when an entity is edited within the cache.
     */
    interface EntityUpdater {
        (dataProxy: ApolloTransaction, entity: any, previous: any): void;
    }
    interface EntityUpdaters {
        [typeName: string]: EntityUpdater;
    }
    /**
     * Configuration for a Hermes cache.
     */
    interface Configuration {
        /** Whether __typename should be injected into nodes in queries. */
        addTypename?: boolean;
        /**
         * Given a node, determines a _globally unique_ identifier for it to be used
         * by the cache.
         *
         * Generally, any node that is considered to be an entity (domain object) by
         * the application should be given an id.  All entities are normalized
         * within the cache; everything else is not.
         */
        entityIdForNode?: EntityIdMapper;
        /**
         * Transformation function to be run on entity nodes that change during
         * write operation; an entity node is defined by `entityIdForNode`.
         */
        entityTransformer?: EntityTransformer;
        /**
         * Whether values in the graph should be frozen.
         *
         * Defaults to true unless process.env.NODE_ENV === 'production'
         */
        freeze?: boolean;
        /**
         * Parameterized fields that should redirect to entities in the cache when
         * there is no value currently cached for their location.
         *
         * Note that you may only redirect to _entities_ within the graph.
         * Redirection to arbitrary nodes is not supported.
         */
        resolverRedirects?: ResolverRedirects;
        /**
         * Callbacks that are triggered when entities of a given type are changed.
         *
         * These provide the opportunity to make edits to the cache based on the
         * values that were edited within entities.  For example: keeping a filtered
         * list in sync w/ the values within it.
         *
         * Note that these callbacks are called immediately before a transaction is
         * committed.  You will not see their effect _during_ a transaction.
         */
        entityUpdaters?: EntityUpdaters;
        /**
         * Callback that is triggered when there is a change in the cache.
         *
         * This allow the cache to be integrated with external tools such as Redux.
         * It allows other tools to be notified when there are changes.
         */
        onChange?: OnChangeCallback;
        /**
         * The tracer to instrument the cache with.
         *
         * If not supplied, a ConsoleTracer will be constructed, with `verbose` and
         * `logger` passed as its arguments.
         */
        tracer?: Tracer;
        /**
         * Whether debugging information should be logged out.
         *
         * Enabling this will cause the cache to emit log events for most operations
         * performed against it.
         *
         * Ignored if `tracer` is supplied.
         */
        verbose?: boolean;
        /**
         * The logger to use when emitting messages. By default, `console`.
         *
         * Ignored if `tracer` is supplied.
         */
        logger?: ConsoleTracer.Logger;
    }
}
/**
 * Configuration and shared state used throughout the cache's operation.
 */
export declare class CacheContext {
    /** Retrieve the EntityId for a given node, if any. */
    readonly entityIdForValue: CacheContext.EntityIdForValue;
    /** Run transformation on changed entity node, if any. */
    readonly entityTransformer: CacheContext.EntityTransformer | undefined;
    /** Whether we should freeze snapshots after writes. */
    readonly freezeSnapshots: boolean;
    /** Whether the cache should emit debug level log events. */
    readonly verbose: boolean;
    /** Configured resolver redirects. */
    readonly resolverRedirects: CacheContext.ResolverRedirects;
    /** Configured entity updaters. */
    readonly entityUpdaters: CacheContext.EntityUpdaters;
    /** Configured on-change callback */
    readonly onChange: CacheContext.OnChangeCallback | undefined;
    /** The tracer we should use. */
    readonly tracer: Tracer;
    /** Whether __typename should be injected into nodes in queries. */
    private readonly _addTypename;
    /** All currently known & processed GraphQL documents. */
    private readonly _queryInfoMap;
    /** All currently known & parsed queries, for identity mapping. */
    private readonly _operationMap;
    constructor(config?: CacheContext.Configuration);
    /**
     * Performs any transformations of operation documents.
     *
     * Cache consumers should call this on any operation document prior to calling
     * any other method in the cache.
     */
    transformDocument(document: DocumentNode): DocumentNode;
    /**
     * Returns a memoized & parsed operation.
     *
     * To aid in various cache lookups, the result is memoized by all of its
     * values, and can be used as an identity for a specific operation.
     */
    parseOperation(raw: RawOperation): OperationInstance;
    /**
     * Retrieves a memoized QueryInfo for a given GraphQL document.
     */
    private _queryInfo(cacheKey, raw);
}
/**
 * Wrap entityIdForNode so that it coerces all values to strings.
 */
export declare function _makeEntityIdMapper(mapper?: CacheContext.EntityIdMapper): CacheContext.EntityIdForValue;
export declare function defaultEntityIdMapper(node: {
    id?: any;
}): any;
export declare function operationCacheKey(document: DocumentNode, fragmentName?: string): string;
