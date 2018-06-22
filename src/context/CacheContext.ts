import { addTypenameToDocument, isEqual } from 'apollo-utilities';

import { ApolloTransaction } from '../apollo/Transaction';
import { CacheSnapshot } from '../CacheSnapshot';
import { areChildrenDynamic, expandVariables } from '../ParsedQueryNode';
import { JsonObject } from '../primitive';
import { EntityId, OperationInstance, RawOperation } from '../schema';
import { DocumentNode, isObject } from '../util';

import { ConsoleTracer } from './ConsoleTracer';
import { QueryInfo } from './QueryInfo';
import { Tracer } from './Tracer';

// Augment DocumentNode type with Hermes's properties
// Because react-apollo can call us without doing transformDocument
// to be safe, we will always call transformDocument then flag that
// we have already done so to not repeating the process.
declare module 'graphql/language/ast' {
  export interface DocumentNode {
    /** Indicating that query has already ran transformDocument */
    hasBeenTransformed?: boolean;
  }
}

// Make sure that we are explicitly referencing process.env.NODE_ENV so that
// people relying on Webpack's DefinePlugin (or --env production) get the
// expected outcome.
let productionMode = false;
try {
  productionMode = process.env.NODE_ENV === 'production';
} catch (error) {
  // Welp; we tried.
}

export namespace CacheContext {

  export type EntityIdForNode = (node: JsonObject) => EntityId | undefined;
  export type EntityIdForValue = (value: any) => EntityId | undefined;
  export type EntityIdMapper = (node: JsonObject) => string | number | undefined;
  export type EntityTransformer = (node: JsonObject) => void;
  export type OnChangeCallback = (newCacheShapshot: CacheSnapshot, editedNodeIds: Set<String>) => void;

  /**
   * Expected to return an EntityId or undefined, but we loosen the restrictions
   * for ease of declaration.
   */
  export type ResolverRedirect = (args: JsonObject) => any;
  export type ResolverRedirects = {
    [typeName: string]: {
      [fieldName: string]: ResolverRedirect,
    },
  };

  /**
   * Callback that is triggered when an entity is edited within the cache.
   */
  export interface EntityUpdater {
    // TODO: It's a bit odd that this is the _only_ Apollo-specific interface
    // that we're exposing.  Do we want to keep that?  It does mirror a
    // mutation's update callback nicely.
    (dataProxy: ApolloTransaction, entity: any, previous: any): void;
  }

  export interface EntityUpdaters {
    [typeName: string]: EntityUpdater;
  }

  /**
   * Configuration for a Hermes cache.
   */
  export interface Configuration {
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
export class CacheContext {

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
  private readonly _addTypename: boolean;
  /** All currently known & processed GraphQL documents. */
  private readonly _queryInfoMap = new Map<string, QueryInfo>();
  /** All currently known & parsed queries, for identity mapping. */
  private readonly _operationMap = new Map<string, OperationInstance[]>();

  constructor(config: CacheContext.Configuration = {}) {
    this.entityIdForValue = _makeEntityIdMapper(config.entityIdForNode);
    this.entityTransformer = config.entityTransformer;
    this.freezeSnapshots = 'freeze' in config ? !!config.freeze : !productionMode;
    this.verbose = !!config.verbose;
    this.resolverRedirects = config.resolverRedirects || {};
    this.onChange = config.onChange;
    this.entityUpdaters = config.entityUpdaters || {};
    this.tracer = config.tracer || new ConsoleTracer(!!config.verbose, config.logger);

    this._addTypename = config.addTypename || false;
  }

  /**
   * Performs any transformations of operation documents.
   *
   * Cache consumers should call this on any operation document prior to calling
   * any other method in the cache.
   */
  transformDocument(document: DocumentNode): DocumentNode {
    if (this._addTypename && !document.hasBeenTransformed) {
      const transformedDocument = addTypenameToDocument(document);
      transformedDocument.hasBeenTransformed = true;
      return transformedDocument;
    }
    return document;
  }

  /**
   * Returns a memoized & parsed operation.
   *
   * To aid in various cache lookups, the result is memoized by all of its
   * values, and can be used as an identity for a specific operation.
   */
  parseOperation(raw: RawOperation): OperationInstance {
    // It appears like Apollo or someone upstream is cloning or otherwise
    // modifying the queries that are passed down.  Thus, the operation source
    // is a more reliable cache key…
    const cacheKey = operationCacheKey(raw.document, raw.fragmentName);
    let operationInstances = this._operationMap.get(cacheKey);
    if (!operationInstances) {
      operationInstances = [];
      this._operationMap.set(cacheKey, operationInstances);
    }

    // Do we already have a copy of this guy?
    for (const instance of operationInstances) {
      if (instance.rootId !== raw.rootId) continue;
      if (!isEqual(instance.variables, raw.variables)) continue;
      return instance;
    }

    const updateRaw: RawOperation = {
      ...raw,
      document: this.transformDocument(raw.document),
    };

    const info = this._queryInfo(cacheKey, updateRaw);
    const fullVariables = { ...info.variableDefaults, ...updateRaw.variables } as JsonObject;
    const operation = {
      info,
      rootId: updateRaw.rootId,
      parsedQuery: expandVariables(info.parsed, fullVariables),
      isStatic: !areChildrenDynamic(info.parsed),
      variables: updateRaw.variables,
    };
    operationInstances.push(operation);

    return operation;
  }

  /**
   * Retrieves a memoized QueryInfo for a given GraphQL document.
   */
  private _queryInfo(cacheKey: string, raw: RawOperation): QueryInfo {
    if (!this._queryInfoMap.has(cacheKey)) {
      this._queryInfoMap.set(cacheKey, new QueryInfo(this, raw));
    }
    return this._queryInfoMap.get(cacheKey)!;
  }

}

/**
 * Wrap entityIdForNode so that it coerces all values to strings.
 */
export function _makeEntityIdMapper(
  mapper: CacheContext.EntityIdMapper = defaultEntityIdMapper,
): CacheContext.EntityIdForValue {
  return function entityIdForNode(node: JsonObject) {
    if (!isObject(node)) return undefined;

    // We don't trust upstream implementations.
    const entityId = mapper(node);
    if (typeof entityId === 'string') return entityId;
    if (typeof entityId === 'number') return String(entityId);
    return undefined;
  };
}

export function defaultEntityIdMapper(node: { id?: any }) {
  return node.id;
}

export function operationCacheKey(document: DocumentNode, fragmentName?: string) {
  if (fragmentName) {
    return `${fragmentName}❖${document.loc!.source.body}`;
  }
  return document.loc!.source.body;
}
