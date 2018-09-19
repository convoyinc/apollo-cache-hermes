"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("top-level values with nested parameterized value", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                one: [
                    {
                        four: 'FOUR',
                        two: [
                            {
                                three: {
                                    id: '30',
                                    name: 'Three0',
                                    extraValue: '30-42',
                                },
                            },
                            {
                                three: {
                                    id: '31',
                                    name: 'Three1',
                                    extraValue: '31-42',
                                },
                            },
                            null,
                        ],
                    },
                    null,
                ],
            }, "query getAFoo($id: ID!) {\n          one {\n            four\n            two {\n              three(id: $id, withExtra: true) {\n                id name extraValue\n              }\n            }\n          }\n        }", cacheContext, { id: 1 });
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
            var parameterizedId0 = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 0, 'two', 0, 'three'], { id: 1, withExtra: true });
            var parameterizedId1 = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 0, 'two', 1, 'three'], { id: 1, withExtra: true });
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [
                        { id: parameterizedId0, path: ['one', 0, 'two', 0, 'three'] },
                        { id: parameterizedId1, path: ['one', 0, 'two', 1, 'three'] },
                    ],
                    data: {
                        one: [
                            {
                                four: 'FOUR',
                                two: [undefined, undefined, null],
                            },
                            null,
                        ],
                    },
                },
                _a[parameterizedId0] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 0, 'two', 0, 'three'] }],
                    outbound: [{ id: '30', path: [] }],
                    data: null,
                },
                _a['30'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: parameterizedId0, path: [] }],
                    data: {
                        id: '30',
                        name: 'Three0',
                        extraValue: '30-42',
                    },
                },
                _a[parameterizedId1] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 0, 'two', 1, 'three'] }],
                    outbound: [{ id: '31', path: [] }],
                    data: null,
                },
                _a['31'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: parameterizedId1, path: [] }],
                    data: {
                        id: '31',
                        name: 'Three1',
                        extraValue: '31-42',
                    },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9wTGV2ZWxWYWx1ZVdpdGhEZWVwbHlOZXN0ZWRQYXJhbWV0ZXJpemVkUmVmZXJlbmNlSW5BcnJheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRvcExldmVsVmFsdWVXaXRoRGVlcGx5TmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZUluQXJyYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpRUFBZ0U7QUFDaEUsK0VBQTJGO0FBQzNGLG9EQUF1RTtBQUN2RSwrQ0FBb0Y7QUFFNUUsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQyxrREFBa0QsRUFBRTtRQUUzRCxJQUFJLGFBQXlDLENBQUM7UUFDOUMsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztZQUNoRCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7Z0JBQ0UsR0FBRyxFQUFFO29CQUNIO3dCQUNFLElBQUksRUFBRSxNQUFNO3dCQUNaLEdBQUcsRUFBRTs0QkFDSDtnQ0FDRSxLQUFLLEVBQUU7b0NBQ0wsRUFBRSxFQUFFLElBQUk7b0NBQ1IsSUFBSSxFQUFFLFFBQVE7b0NBQ2QsVUFBVSxFQUFFLE9BQU87aUNBQ3BCOzZCQUNGOzRCQUNEO2dDQUNFLEtBQUssRUFBRTtvQ0FDTCxFQUFFLEVBQUUsSUFBSTtvQ0FDUixJQUFJLEVBQUUsUUFBUTtvQ0FDZCxVQUFVLEVBQUUsT0FBTztpQ0FDcEI7NkJBQ0Y7NEJBQ0QsSUFBSTt5QkFDTDtxQkFDRjtvQkFDRCxJQUFJO2lCQUNMO2FBQ0YsRUFDRCw4TkFTRSxFQUNGLFlBQVksRUFDWixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FDVixDQUFDO1lBRUYsYUFBYSxHQUFHLGlCQUFPLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFF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