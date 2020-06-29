import { CacheSnapshot } from '../CacheSnapshot';
import { GraphSnapshot } from '../GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../nodes';
import { JsonObject, JsonValue, PathPart } from '../primitive';
import { NodeId } from '../schema';
import {
  isObject,
  addNodeReference,
  deepGet,
} from '../util';

import { nodeIdForParameterizedValue, NodeSnapshotMap } from './SnapshotEditor';

/**
 * Function called during migration of entities to add or update a field.
 * The new value will be whatever the function evaluates to. If the field to
 * be migrated is a nested object, the migration function should produce a new
 * object, instead of re-using the old one, and make the changes on top.
 */
export type FieldMigration = (previous: JsonValue) => any;
export type EntityMigrations = {
  [typeName: string]: {
    [fieldName: string]: FieldMigration,
  },
};

export type ParameterizedMigrationEntry = {
  path: PathPart[],
  args: JsonObject | undefined,
  defaultReturn: any,
  copyFrom?: {
    path: PathPart[],
    args: JsonObject | undefined,
  },
};
export type ParameterizedMigrations = {
  // typename is the typename of the container
  [typeName: string]: ParameterizedMigrationEntry[],
};

export type MigrationMap = {
  _entities?: EntityMigrations,
  _parameterized?: ParameterizedMigrations,
};

/**
 * Returns the migrated entity snapshot. Supports add and modify but not delete
 * fields.
 */
function migrateEntity(
  id: NodeId,
  snapshot: EntitySnapshot,
  nodesToAdd: NodeSnapshotMap,
  migrationMap?: MigrationMap,
  allNodes?: NodeSnapshotMap
): EntitySnapshot {

  // Only if object and if valid MigrationMap is provided
  if (!isObject(snapshot.data)) return snapshot;

  const entityMigrations = deepGet(migrationMap, ['_entities']) as EntityMigrations;
  const parameterizedMigrations = deepGet(migrationMap, ['_parameterized']) as ParameterizedMigrations;

  const typeName = snapshot.data.__typename as string || 'Query';

  if (entityMigrations && entityMigrations[typeName]) {
    for (const field in entityMigrations[typeName]) {
      const fieldMigration = entityMigrations[typeName][field];
      if (!fieldMigration) continue;
      snapshot.data[field] = fieldMigration(snapshot.data[field]);
    }
  }

  if (parameterizedMigrations && parameterizedMigrations[typeName]) {
    for (const parameterized of parameterizedMigrations[typeName]) {
      const fieldId = nodeIdForParameterizedValue(id, parameterized.path, parameterized.args);
      // create a parameterized value snapshot if container doesn't know of the
      // parameterized field we expect
      if (!snapshot.outbound || !snapshot.outbound.find(s =>  s.id === fieldId)) {
        let newData = parameterized.defaultReturn;
        if (allNodes && parameterized.copyFrom) {
          const { path, args } = parameterized.copyFrom;
          const copyFromFieldId = nodeIdForParameterizedValue(id, path, args);
          const copyFromNode = allNodes[copyFromFieldId];
          if (copyFromNode) {
            newData = copyFromNode.data;
          } else {
            // If copyFrom doesn't exist added so we can retrieve it on read
            nodesToAdd[copyFromFieldId] = new ParameterizedValueSnapshot(newData);
          }
        }
        const newNode = new ParameterizedValueSnapshot(newData);
        nodesToAdd[fieldId] = newNode;

        // update the reference for the new node in the container
        addNodeReference('inbound', newNode, id, parameterized.path);
        addNodeReference('outbound', snapshot, fieldId, parameterized.path);
      }
    }
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
    const nodesToAdd: NodeSnapshotMap = Object.create(null);
    const nodes = cacheSnapshot.baseline._values;
    for (const nodeId in nodes) {
      const nodeSnapshot = nodes[nodeId];
      if (nodeSnapshot instanceof EntitySnapshot) {
        migrateEntity(nodeId, nodeSnapshot, nodesToAdd, migrationMap, nodes);
      }
    }

    // rebuild the migrated GraphSnapshot
    const snapshots = { ...cacheSnapshot.baseline._values };
    for (const addId in nodesToAdd) {
      const nodeToAdd = nodesToAdd[addId];
      if (!nodeToAdd) continue;
      snapshots[addId] = nodeToAdd;
    }
    cacheSnapshot.baseline = new GraphSnapshot(snapshots);
  }
  return cacheSnapshot;
}
