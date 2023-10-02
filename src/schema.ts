import { QueryInfo } from './context';
import { NodeReference } from './nodes';
import { ParsedQuery } from './ParsedQueryNode';
import { JsonObject, JsonValue, NestedValue } from './primitive';
import { DocumentNode, isScalar, isObject } from './util';

/**
 * Change ids track diffs to the store that may eventually be rolled back.
 */
export type ChangeId = string;

/**
 * All node ids must be strings, for now.
 */
export type NodeId = string;

/**
 * Entity ids are just a specialized node id.
 *
 * Having a separate type is useful for documentation and safety.
 */
export type EntityId = NodeId;

/**
 * There are a few pre-defined nodes present in all schemas.
 */
export enum StaticNodeId {
  QueryRoot = 'ROOT_QUERY',
  MutationRoot = 'ROOT_MUTATION',
  SubscriptionRoot = 'ROOT_SUBSCRIPTION',
}

/**
 * All the information needed to describe a complete GraphQL operation that can
 * be made against the cache (read or written).
 */
export interface RawOperation {
  /** The id of the node to begin the query at. */
  readonly rootId: NodeId;
  /** A parsed GraphQL document, declaring an operation to execute. */
  readonly document: DocumentNode;
  /** Any variables used by parameterized fields within the selection set. */
  readonly variables?: JsonObject;
  /** Fragment's name in readFragment/writeFragment with multiple fragments */
  readonly fragmentName?: string;
  /** A boolean flag indicating whether the operation is constructed
   * from fragment only document.
   * This is used to skip queryInfo._assertAllVariablesDeclared
   **/
  readonly fromFragmentDocument?: boolean;
}

/**
 * A processed query, ready for consumption by the cache, with values for any
 * variables already substituted in.
 */
export interface OperationInstance<TSerialized> {
  /** The id of the node to begin the query at. */
  readonly rootId: NodeId;
  /** A parsed GraphQL document, declaring an operation to execute. */
  readonly info: QueryInfo<TSerialized>;
  /** Parsed form of the query, with values substituted for any variables. */
  readonly parsedQuery: ParsedQuery;
  /** Whether the operation contains _no_ parameterized values. */
  readonly isStatic: boolean;
  /** Any variables used by parameterized fields within the selection set. */
  readonly variables?: JsonObject;
}

/**
 * Represents a single change to the cache
 */
export type CacheDelta =
  | { delete: string }
  | { query: RawOperation, payload?: JsonObject }
  | { id: string, payload: JsonObject, deleted: Set<string> }

/**
 * Lists of types which are JSON serializable
 */
export namespace Serializable {
  /**
   * JSON serializable type of NodeSnapshot in GraphSnapshot
   *
   * This is used when doing extract and restore cache's stage
   */
  export interface GraphSnapshot {
    [key: string]: Serializable.NodeSnapshot;
  }

  export interface NodeSnapshot {
    type: Serializable.NodeSnapshotType;
    inbound?: NodeReference[];
    outbound?: NodeReference[];
    data?: NestedValue<JsonValue | undefined>;
  }

  /**
   * Type of NodeSnapshot. We need this so that when deserialize, we can
   * correct create NodeSnapshot.
   *
   */
  export const enum NodeSnapshotType {
    EntitySnapshot = 0,
    ParameterizedValueSnapshot = 1,
  }
}

export function isSerializable(value: any, allowUndefined?: boolean): boolean {
  if (isScalar(value)) {
    // NaN is considered to typeof number
    const isNaNValue = Number.isNaN(value as any);
    return allowUndefined ? !isNaNValue : !isNaNValue && value !== undefined;
  }

  if (isObject(value)) {
    for (const propName of Object.getOwnPropertyNames(value)) {
      if (!isSerializable(value[propName], allowUndefined)) {
        return false;
      }
    }
    return true;
  }

  if (Array.isArray(value)) {
    for (const element of value) {
      if (!isSerializable(element, allowUndefined)) {
        return false;
      }
    }
    return true;
  }

  return false;
}
