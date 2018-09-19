"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var lodashGet = require("lodash.get");
var GraphSnapshot_1 = require("../GraphSnapshot");
var nodes_1 = require("../nodes");
var util_1 = require("../util");
var SnapshotEditor_1 = require("./SnapshotEditor");
/**
 * Returns the migrated entity snapshot. Supports add and modify but not delete
 * fields.
 */
function migrateEntity(id, snapshot, nodesToAdd, migrationMap) {
    // Only if object and if valid MigrationMap is provided
    if (!util_1.isObject(snapshot.data))
        return snapshot;
    var entityMigrations = lodashGet(migrationMap, '_entities');
    var parameterizedMigrations = lodashGet(migrationMap, '_parameterized');
    var typeName = snapshot.data.__typename || 'Query';
    if (entityMigrations && entityMigrations[typeName]) {
        for (var field in entityMigrations[typeName]) {
            var fieldMigration = entityMigrations[typeName][field];
            if (!fieldMigration)
                continue;
            snapshot.data[field] = fieldMigration(snapshot.data[field]);
        }
    }
    if (parameterizedMigrations && parameterizedMigrations[typeName]) {
        var _loop_1 = function (parameterized) {
            var fieldId = SnapshotEditor_1.nodeIdForParameterizedValue(id, parameterized.path, parameterized.args);
            // create a parameterized value snapshot if container doesn't know of the
            // parameterized field we expect
            if (!snapshot.outbound || !snapshot.outbound.find(function (s) { return s.id === fieldId; })) {
                var newNode = new nodes_1.ParameterizedValueSnapshot(parameterized.defaultReturn);
                nodesToAdd[fieldId] = newNode;
                // update the reference for the new node in the container
                util_1.addNodeReference('inbound', newNode, id, parameterized.path);
                util_1.addNodeReference('outbound', snapshot, fieldId, parameterized.path);
            }
        };
        try {
            for (var _a = tslib_1.__values(parameterizedMigrations[typeName]), _b = _a.next(); !_b.done; _b = _a.next()) {
                var parameterized = _b.value;
                _loop_1(parameterized);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    return snapshot;
    var e_1, _c;
}
/**
 * Migrates the CacheSnapshot. This function migrates the field values
 * in place so use it with care. Do not use it on the Hermes' current
 * CacheSnapshot. Doing so run the risk of violating immutability.
 */
function migrate(cacheSnapshot, migrationMap) {
    if (migrationMap) {
        var nodesToAdd = Object.create(null);
        var nodes = cacheSnapshot.baseline._values;
        for (var nodeId in nodes) {
            var nodeSnapshot = nodes[nodeId];
            if (nodeSnapshot instanceof nodes_1.EntitySnapshot) {
                migrateEntity(nodeId, nodeSnapshot, nodesToAdd, migrationMap);
            }
        }
        // rebuild the migrated GraphSnapshot
        var snapshots = tslib_1.__assign({}, cacheSnapshot.baseline._values);
        for (var addId in nodesToAdd) {
            var nodeToAdd = nodesToAdd[addId];
            if (!nodeToAdd)
                continue;
            snapshots[addId] = nodeToAdd;
        }
        cacheSnapshot.baseline = new GraphSnapshot_1.GraphSnapshot(snapshots);
    }
    return cacheSnapshot;
}
exports.migrate = migrate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsc0NBQXlDO0FBR3pDLGtEQUFpRDtBQUNqRCxrQ0FBc0U7QUFHdEUsZ0NBR2lCO0FBRWpCLG1EQUFnRjtBQThCaEY7OztHQUdHO0FBQ0gsdUJBQ0UsRUFBVSxFQUNWLFFBQXdCLEVBQ3hCLFVBQTJCLEVBQzNCLFlBQTJCO0lBRzNCLHVEQUF1RDtJQUN2RCxFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFBQyxNQUFNLENBQUMsUUFBUSxDQUFDO0lBRTlDLElBQU0sZ0JBQWdCLEdBQUcsU0FBUyxDQUFDLFlBQVksRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM5RCxJQUFNLHVCQUF1QixHQUFHLFNBQVMsQ0FBQyxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUUxRSxJQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQW9CLElBQUksT0FBTyxDQUFDO0lBRS9ELEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxHQUFHLENBQUMsQ0FBQyxJQUFNLEtBQUssSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsSUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekQsRUFBRSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUM7Z0JBQUMsUUFBUSxDQUFDO1lBQzlCLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO0lBQ0gsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLHVC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