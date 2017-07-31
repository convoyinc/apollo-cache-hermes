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
