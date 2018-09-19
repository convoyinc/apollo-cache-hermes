"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operations_1 = require("../../../../src/operations");
var SnapshotEditor_1 = require("../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.prune", function () {
    var extractResult;
    beforeAll(function () {
        var cacheContext = helpers_1.createStrictCacheContext();
        var snapshot = helpers_1.createGraphSnapshot({
            rows: {
                elements: [
                    [
                        { id: 'a', value: 1 },
                        { id: 'b', value: 2 },
                    ],
                    [
                        { id: 'c', value: 3 },
                        { id: 'd', value: 4 },
                        null,
                    ],
                    null,
                ],
            },
        }, "query getTable($tableName: String!) {\n        rows {\n          elements(table: $tableName) {\n            id\n            value\n          }\n        }\n      }", cacheContext, { tableName: 'This is table name' });
        var pruneQuery = helpers_1.query("query getTable($tableName: String!) {\n        rows {\n          elements(table: $tableName) {\n            id\n          }\n        }\n      }", { tableName: 'This is table name' });
        var pruned = operations_1.prune(cacheContext, snapshot, pruneQuery);
        extractResult = operations_1.extract(pruned.snapshot, cacheContext);
    });
    it("prunes fields from parameterized 2d reference array correctly", function () {
        var parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['rows', 'elements'], { table: 'This is table name' });
        expect(extractResult).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                outbound: [{ id: parameterizedId, path: ['rows', 'elements'] }],
            },
            _a[parameterizedId] = {
                type: 1 /* ParameterizedValueSnapshot */,
                inbound: [{ id: QueryRootId, path: ['rows', 'elements'] }],
                outbound: [
                    { id: 'a', path: [0, 0] },
                    { id: 'b', path: [0, 1] },
                    { id: 'c', path: [1, 0] },
                    { id: 'd', path: [1, 1] },
                ],
                data: [
                    [
                        undefined,
                        undefined,
                    ],
                    [
                        undefined,
                        undefined,
                        null,
                    ],
                    null,
                ],
            },
            _a['a'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: parameterizedId, path: [0, 0] }],
                data: { id: 'a' },
            },
            _a['b'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: parameterizedId, path: [0, 1] }],
                data: { id: 'b' },
            },
            _a['c'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: parameterizedId, path: [1, 0] }],
                data: { id: 'c' },
            },
            _a['d'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: parameterizedId, path: [1, 1] }],
                data: { id: 'd' },
            },
            _a));
        var _a;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVyaXplZDJEUmVmZXJlbmNlc0FycmF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGFyYW1ldGVyaXplZDJEUmVmZXJlbmNlc0FycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseURBQTREO0FBQzVELDRFQUF3RjtBQUN4RixpREFBb0U7QUFDcEUsNENBQXdGO0FBQ2hGLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUMzQixJQUFJLGFBQXlDLENBQUM7SUFDOUMsU0FBUyxDQUFDO1FBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztRQUNoRCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7WUFDRSxJQUFJLEVBQUU7Z0JBQ0osUUFBUSxFQUFFO29CQUNSO3dCQUNFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3dCQUNyQixFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtxQkFDdEI7b0JBQ0Q7d0JBQ0UsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQ3JCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3dCQUNyQixJQUFJO3FCQUNMO29CQUNELElBQUk7aUJBQ0w7YUFDRjtTQUNGLEVBQ0Qsb0tBT0UsRUFDRixZQUFZLEVBQ1osRUFBRSxTQUFTLEVBQUUsb0JBQW9CLEVBQUUsQ0FDcEMsQ0FBQztRQUVGLElBQU0sVUFBVSxHQUFHLGVBQUssQ0FDdEIsaUpBTUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxvQkFBb0IsRUFBRSxDQUN4QyxDQUFDO1FBQ0YsSUFBTSxNQUFNLEdBQUcsa0JBQUssQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3pELGFBQWEsR0FBRyxvQkFBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDekQsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsK0RBQStELEVBQUU7UUFDbEUsSUFBTSxlQUFlLEdBQUcsNENBQTJCLENBQ2pELFdBQVcsRUFDWCxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsRUFDcEIsRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsQ0FDaEMsQ0FBQztRQUVGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDOUIsR0FBQyxXQUFXLElBQUc7Z0JBQ2IsSUFBSSx3QkFBOEM7Z0JBQ2xELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQzthQUNoRTtZQUNELEdBQUMsZUFBZSxJQUFHO2dCQUNqQixJQUFJLG9DQUEwRDtnQkFDOUQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUMxRCxRQUFRLEVBQUU7b0JBQ1IsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDekIsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDekIsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDekIsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtpQkFDMUI7Z0JBQ0QsSUFBSSxFQUFFO29CQUNKO3dCQUNFLFNBQVM7d0JBQ1QsU0FBUztxQkFDVjtvQkFDRDt3QkFDRSxTQUFTO3dCQUNULFNBQVM7d0JBQ1QsSUFBSTtxQkFDTDtvQkFDRCxJQUFJO2lCQUNMO2FBQ0Y7WUFDRCxPQUFHLEdBQUU7Z0JBQ0gsSUFBSSx3QkFBOEM7Z0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRTthQUNsQjtZQUNELE9BQUcsR0FBRTtnQkFDSCxJQUFJLHdCQUE4QztnQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFO2FBQ2xCO1lBQ0QsT0FBRyxHQUFFO2dCQUNILElBQUksd0JBQThDO2dCQUNsRCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUU7YUFDbEI7WUFDRCxPQUFHLEdBQUU7Z0JBQ0gsSUFBSSx3QkFBOEM7Z0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRTthQUNsQjtnQkFDRCxDQUFDOztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==