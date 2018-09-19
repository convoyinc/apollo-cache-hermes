"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operations_1 = require("../../../../../src/operations");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("2d array of parameterized references", function () {
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
            }, "query getTable($tableName: String!) {\n          rows {\n            elements(table: $tableName) {\n              id\n              value\n            }\n          }\n        }", cacheContext, { tableName: 'This is table name' });
            extractResult = operations_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
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
                    data: { id: 'a', value: 1 },
                },
                _a['b'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: parameterizedId, path: [0, 1] }],
                    data: { id: 'b', value: 2 },
                },
                _a['c'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: parameterizedId, path: [1, 0] }],
                    data: { id: 'c', value: 3 },
                },
                _a['d'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: parameterizedId, path: [1, 1] }],
                    data: { id: 'd', value: 4 },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlkaW1lbnNpb25hbFJlZmVyZW5jZXNBcnJheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm11bHRpZGltZW5zaW9uYWxSZWZlcmVuY2VzQXJyYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0REFBd0Q7QUFDeEQsK0VBQTJGO0FBQzNGLG9EQUF1RTtBQUN2RSwrQ0FBb0Y7QUFDNUUsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRTtRQUUvQyxJQUFJLGFBQXlDLENBQUM7UUFDOUMsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztZQUNoRCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7Z0JBQ0UsSUFBSSxFQUFFO29CQUNKLFFBQVEsRUFBRTt3QkFDUjs0QkFDRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTs0QkFDckIsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7eUJBQ3RCO3dCQUNEOzRCQUNFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFOzRCQUNyQixFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTs0QkFDckIsSUFBSTt5QkFDTDt3QkFDRCxJQUFJO3FCQUNMO2lCQUNGO2FBQ0YsRUFDRCxrTEFPRSxFQUNGLFlBQVksRUFDWixFQUFFLFNBQVMsRUFBRSxvQkFBb0IsRUFBRSxDQUNwQyxDQUFDO1lBRUYsYUFBYSxHQUFHLG9CQUFPLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFO1lBQ3ZDLElBQU0sZUFBZSxHQUFHLDRDQUEyQixDQUNqRCxXQUFXLEVBQ1gsQ0FB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