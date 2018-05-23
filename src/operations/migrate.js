"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../nodes");
var util_1 = require("../util");
/**
 * Returns the migrated entity snapshot. Supports add and modify but not delete
 * fields.
 */
function migrateEntity(snapshot, migrationMap) {
    // Only if object and if valid migrationMap is provided
    if (!util_1.isObject(snapshot.data) || !migrationMap)
        return snapshot;
    var typeName = snapshot.data.__typename;
    if (!typeName)
        typeName = 'Query';
    if (!migrationMap[typeName])
        return snapshot;
    for (var field in migrationMap[typeName]) {
        var fieldMigration = migrationMap[typeName][field];
        if (!fieldMigration)
            continue;
        // References work in very specific way in Hermes. If client tries
        // to migrate them at will, bad things happnen. Let's not let them shoot
        // themselves
        if (util_1.isReferenceField(snapshot, [field])) {
            throw new Error(typeName + "." + field + " is a reference field. Migration is not allowed");
        }
        snapshot.data[field] = fieldMigration(snapshot.data[field]);
    }
    return snapshot;
}
exports.migrateEntity = migrateEntity;
/**
 * Migrates the CacheSnapshot. This function migrates the field values
 * in place so use it with care. Do not use it on the Hermes' current
 * CacheSnapshot. Doing so run the risk of violating immutability.
 */
function migrate(cacheSnapshot, migrationMap) {
    if (migrationMap) {
        var entities = cacheSnapshot.baseline._values;
        for (var id in entities) {
            var nodeSnapshot = entities[id];
            if (nodeSnapshot instanceof nodes_1.EntitySnapshot) {
                migrateEntity(nodeSnapshot, migrationMap);
            }
        }
    }
    return cacheSnapshot;
}
exports.migrate = migrate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxrQ0FBMEM7QUFFMUMsZ0NBQXFEO0FBZXJEOzs7R0FHRztBQUNILHVCQUE4QixRQUF3QixFQUFFLFlBQTJCO0lBRWpGLHVEQUF1RDtJQUN2RCxFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7UUFBQyxNQUFNLENBQUMsUUFBUSxDQUFDO0lBRS9ELElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBZ0MsQ0FBQztJQUM5RCxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztRQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7SUFDbEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFBQyxNQUFNLENBQUMsUUFBUSxDQUFDO0lBQzdDLEdBQUcsQ0FBQyxDQUFDLElBQU0sS0FBSyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0MsSUFBTSxjQUFjLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JELEVBQUUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDO1lBQUMsUUFBUSxDQUFDO1FBQzlCLGtFQUFrRTtRQUNsRSx3RUFBd0U7UUFDeEUsYUFBYTtRQUNiLEVBQUUsQ0FBQyxDQUFDLHVCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQUksUUFBUSxTQUFJLEtBQUssb0RBQWlELENBQUMsQ0FBQztRQUN6RixDQUFDO1FBQ0QsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRCxNQUFNLENBQUMsUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUFyQkQsc0NBcUJDO0FBQ0Q7Ozs7R0FJRztBQUNILGlCQUF3QixhQUE0QixFQUFFLFlBQTJCO0lBQy9FLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDakIsSUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7UUFDaEQsR0FBRyxDQUFDLENBQUMsSUFBTSxFQUFFLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEMsRUFBRSxDQUFDLENBQUMsWUFBWSxZQUFZLHNCQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxhQUFhLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzVDLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUNELE1BQU0sQ0FBQyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQVhELDBCQVdDIn0=