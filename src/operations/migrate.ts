import { CacheSnapshot } from '../CacheSnapshot';
import { EntitySnapshot } from '../nodes';
import { JsonValue } from '../primitive';
import { isObject, isReferenceField } from '../util';

/**
 * Function called during migration of entities to add or update a field.
 * The new value will be whatever the function evaluates to.
 */
export type FieldMigration = (previous: JsonValue) => any;
export type MigrationMap = {
  [typeName: string]: {
    [fieldName: string]: FieldMigration,
  },
};

/**
 * Return the migrated json object. Supports add and modify but not delete
 * fields
 */
export function migrateEntity(snapshot: EntitySnapshot, migrationMap?: MigrationMap): EntitySnapshot {

  // Only if object and if valid migrationMap is provided
  if (!isObject(snapshot.data) || !migrationMap) return snapshot;

  let typeName = snapshot.data.__typename as string | undefined;
  if (!typeName) typeName = 'Query';
  if (!migrationMap[typeName]) return snapshot;
  for (const field in migrationMap[typeName]) {
    const fieldMigration = migrationMap[typeName][field];
    if (!fieldMigration) continue;
    if (isReferenceField(snapshot, [field])) {
      throw new Error(`${typeName}.${field} is a reference field. Migration is not allowed`);
    }
    snapshot.data[field] = fieldMigration(snapshot.data[field]);
  }

  return snapshot;
}
/**
 * Migrates the CacheSnapshot. This function migrates the field values
 * in place so use it with care. Do not use it on the Hermes' current
 * CacheSnapshot. Doing so run the risk of violating immutability.
 */
export function migrate(cacheSnapshot: CacheSnapshot, migrationMap?: MigrationMap) {
  if (migrationMap) {
    const entities = cacheSnapshot.baseline._values;
    for (const id in entities) {
      const nodeSnapshot = entities[id];
      if (nodeSnapshot instanceof EntitySnapshot) {
        migrateEntity(nodeSnapshot, migrationMap);
      }
    }
  }
  return cacheSnapshot;
}
