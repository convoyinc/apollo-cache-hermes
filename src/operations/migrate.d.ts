import { CacheSnapshot } from '../CacheSnapshot';
import { JsonObject, JsonValue, PathPart } from '../primitive';
/**
 * Function called during migration of entities to add or update a field.
 * The new value will be whatever the function evaluates to. If the field to
 * be migrated is a nested object, the migration function should produce a new
 * object, instead of re-using the old one, and make the changes on top.
 */
export declare type FieldMigration = (previous: JsonValue) => any;
export declare type EntityMigrations = {
    [typeName: string]: {
        [fieldName: string]: FieldMigration;
    };
};
export declare type ParameterizedMigrationEntry = {
    path: PathPart[];
    args: JsonObject | undefined;
    defaultReturn: any;
};
export declare type ParameterizedMigrations = {
    [typeName: string]: ParameterizedMigrationEntry[];
};
export declare type MigrationMap = {
    _entities?: EntityMigrations;
    _parameterized?: ParameterizedMigrations;
};
/**
 * Migrates the CacheSnapshot. This function migrates the field values
 * in place so use it with care. Do not use it on the Hermes' current
 * CacheSnapshot. Doing so run the risk of violating immutability.
 */
export declare function migrate(cacheSnapshot: CacheSnapshot, migrationMap?: MigrationMap): CacheSnapshot;
