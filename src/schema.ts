import { DeepPartial } from './primitive';

/**
 * Entity ids must be strings, for now.
 */
export type EntityId = string;

/**
 * A mapping of entity types to their interfaces, used to provide type safety
 * throughout the cache.
 */
export type GraphSchema<TEntityType extends string = string> = {
  [Key in TEntityType]: object
}

/**
 * Resolves to the set of entity types available in a schema.
 */
export type EntityType<TSchema extends GraphSchema> = keyof TSchema;

/**
 * Resolves to the interface of an entity type within a schema.
 */
export type Entity<TSchema extends GraphSchema, TType extends keyof TSchema> = DeepPartial<TSchema[TType]>;
