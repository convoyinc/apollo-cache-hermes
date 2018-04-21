import lodashGet = require('lodash.get');

import { isEqual } from 'apollo-utilities';

import { CacheSnapshot } from '../CacheSnapshot';
import { GraphSnapshot } from '../GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../nodes';
import { JsonValue, PathPart } from '../primitive';
import { NodeId } from '../schema';
import {
  isObject,
  isReferenceField,
  addNodeReference,
  removeNodeReference,
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
  args: { [argName: string]: string } | undefined,
  defaultReturn: any,
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
): EntitySnapshot {

  // Only if object and if valid MigrationMap is provided
  if (!isObject(snapshot.data)) return snapshot;

  const entityMigrations = lodashGet(migrationMap, '_entities');
  const parameterizedMigrations = lodashGet(migrationMap, '_parameterized');

  let typeName = snapshot.data.__typename as string | undefined;
  if (!typeName) typeName = 'Query';

  if (entityMigrations && entityMigrations[typeName]) {
    for (const field in entityMigrations[typeName]) {
      const fieldMigration = entityMigrations[typeName][field];
      if (!fieldMigration) continue;
      // References work in very specific way in Hermes. If client tries
      // to migrate them at will, bad things happnen. Let's not let them shoot
      // themselves
      if (isReferenceField(snapshot, [field])) {
        throw new Error(`${typeName}.${field} is a reference field. Migration is not allowed`);
      }
      snapshot.data[field] = fieldMigration(snapshot.data[field]);
    }
  }

  if (parameterizedMigrations && parameterizedMigrations[typeName]) {
    for (const parameterized of parameterizedMigrations[typeName]) {
      const fieldId = nodeIdForParameterizedValue(id, parameterized.path, parameterized.args);
      // create a parameterized value snapshot if container doesn't know of the
      // parameterized field we expect
      if (!snapshot.outbound || !snapshot.outbound.find(s =>  s.id === fieldId)) {
        const newNode = new ParameterizedValueSnapshot(parameterized.defaultReturn);
        nodesToAdd[fieldId] = newNode;

        // update the reference for the new node in the container
        addNodeReference('inbound', newNode, id, parameterized.path);
        addNodeReference('outbound', snapshot, fieldId, parameterized.path);
      }
    }
  }

  return snapshot;
}

function decodeParameterizedId(id: NodeId): any {
  // Split `${containerId}❖${JSON.stringify(path)}❖${JSON.stringify(args)}`
  const idComponents = id.split('❖');
  if (idComponents.length < 3) {
    return undefined;
  }
  return {
    containerId: idComponents[0],
    path: JSON.parse(idComponents[1]),
    args: JSON.parse(idComponents[2]),
  };
}

/**
 * Given the parameterized valud id, returns the EntitySnapshot for its
 * container
 */
function getContainerNode(fieldId: NodeId, currentGraph: GraphSnapshot) {
  const fieldSettings = decodeParameterizedId(fieldId);
  return {
    fieldSettings,
    container: currentGraph.getNodeSnapshot(lodashGet(fieldSettings, 'containerId')) as EntitySnapshot | undefined,
  };
}

/**
 * Determine if a parameterized field is out-of-date and should be garbage
 * collected
 */
function shouldGarbageCollect(id: NodeId, currentGraph: GraphSnapshot, migrationMap?: MigrationMap): boolean {
  const parameterizedMigrations = lodashGet(migrationMap, '_parameterized');
  if (!parameterizedMigrations) return false;

  const { container, fieldSettings } = getContainerNode(id, currentGraph);
  if (!fieldSettings) return false;
  if (!container) return true;

  let typeName = lodashGet(container, ['data', '__typename']) as string | undefined;
  if (!typeName) typeName = 'Query';
  if (!parameterizedMigrations[typeName]) return false;

  const migration = parameterizedMigrations[typeName].find(m => isEqual(m.path, fieldSettings.path));
  if (!migration) return false;

  return !isEqual(migration.args, fieldSettings.args);
}

function makeOrphan(nodeId: NodeId, currentGraph: GraphSnapshot, nodesToRemove: NodeSnapshotMap) {
  const node = currentGraph.getNodeSnapshot(nodeId);
  if (node && node.inbound) {
    for (const { id, path } of node.inbound) {
      const referencingNode = currentGraph.getNodeSnapshot(id);
      if (!referencingNode) continue;
      removeNodeReference('outbound', referencingNode, nodeId, path);
      removeNodeReference('inbound', node, id, path);
      collectTransitiveOrphanedNodes([nodeId], currentGraph, nodesToRemove);
    }
  }
}

/**
 * Transitively collect all orphaned nodes from the graph.
 */
function collectTransitiveOrphanedNodes(ids: NodeId[], currentGraph: GraphSnapshot, nodesToRemove: NodeSnapshotMap) {
  const queue = [...ids];
  while (queue.length) {
    const nodeId = queue.pop()!;
    const node = currentGraph._values[nodeId];
    if (!node) continue;

    nodesToRemove[nodeId] = undefined;

    if (!node.outbound) continue;
    for (const { id, path } of node.outbound) {
      const reference = currentGraph._values[id];
      if (removeNodeReference('inbound', reference, nodeId, path)) {
        queue.push(id);
      }
    }
  }
}

/**
 * Migrates the CacheSnapshot. This function migrates the field values
 * in place so use it with care. Do not use it on the Hermes' current
 * CacheSnapshot. Doing so run the risk of violating immutability.
 */
export function migrate(cacheSnapshot: CacheSnapshot, migrationMap?: MigrationMap) {
  if (migrationMap) {
    const nodesToAdd: NodeSnapshotMap = Object.create(null);
    const nodesToRemove: NodeSnapshotMap = Object.create(null);
    const nodes = cacheSnapshot.baseline._values;
    for (const nodeId in nodes) {
      const nodeSnapshot = nodes[nodeId];
      if (nodeSnapshot instanceof EntitySnapshot) {
        migrateEntity(nodeId, nodeSnapshot, nodesToAdd, migrationMap);
      } else if (nodeSnapshot instanceof ParameterizedValueSnapshot) {
        if (shouldGarbageCollect(nodeId, cacheSnapshot.baseline, migrationMap)) {
          makeOrphan(nodeId, cacheSnapshot.baseline, nodesToRemove);
        }
      }
    }

    // rebuild the migrated GraphSnapshot
    const snapshots = { ...cacheSnapshot.baseline._values };
    for (const removeId in nodesToRemove) {
      delete snapshots[removeId];
    }
    for (const addId in nodesToAdd) {
      const nodeToAdd = nodesToAdd[addId];
      if (!nodeToAdd) continue;
      snapshots[addId] = nodeToAdd;
    }
    cacheSnapshot.baseline = new GraphSnapshot(snapshots);
  }
  return cacheSnapshot;
}
