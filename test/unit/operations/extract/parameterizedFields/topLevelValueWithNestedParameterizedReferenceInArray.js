"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("top-level values wtih nested parameterized value", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                one: {
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
            }, "query getAFoo($id: ID!) {\n          one {\n            four\n            two {\n              three(id: $id, withExtra: true) {\n                id name extraValue\n              }\n            }\n          }\n        }", cacheContext, { id: 1 });
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
            var parameterizedId0 = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two', 0, 'three'], { id: 1, withExtra: true });
            var parameterizedId1 = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two', 1, 'three'], { id: 1, withExtra: true });
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [
                        { id: parameterizedId0, path: ['one', 'two', 0, 'three'] },
                        { id: parameterizedId1, path: ['one', 'two', 1, 'three'] },
                    ],
                    data: {
                        one: {
                            four: 'FOUR',
                            two: [undefined, undefined, null],
                        },
                    },
                },
                _a[parameterizedId0] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
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
                    inbound: [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9wTGV2ZWxWYWx1ZVdpdGhOZXN0ZWRQYXJhbWV0ZXJpemVkUmVmZXJlbmNlSW5BcnJheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRvcExldmVsVmFsdWVXaXRoTmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZUluQXJyYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpRUFBZ0U7QUFDaEUsK0VBQTJGO0FBQzNGLG9EQUF1RTtBQUN2RSwrQ0FBb0Y7QUFFNUUsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQyxrREFBa0QsRUFBRTtRQUUzRCxJQUFJLGFBQXlDLENBQUM7UUFDOUMsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztZQUNoRCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7Z0JBQ0UsR0FBRyxFQUFFO29CQUNILElBQUksRUFBRSxNQUFNO29CQUNaLEdBQUcsRUFBRTt3QkFDSDs0QkFDRSxLQUFLLEVBQUU7Z0NBQ0wsRUFBRSxFQUFFLElBQUk7Z0NBQ1IsSUFBSSxFQUFFLFFBQVE7Z0NBQ2QsVUFBVSxFQUFFLE9BQU87NkJBQ3BCO3lCQUNGO3dCQUNEOzRCQUNFLEtBQUssRUFBRTtnQ0FDTCxFQUFFLEVBQUUsSUFBSTtnQ0FDUixJQUFJLEVBQUUsUUFBUTtnQ0FDZCxVQUFVLEVBQUUsT0FBTzs2QkFDcEI7eUJBQ0Y7d0JBQ0QsSUFBSTtxQkFDTDtpQkFDRjthQUNGLEVBQ0QsOE5BU0UsRUFDRixZQUFZLEVBQ1osRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQ1YsQ0FBQztZQUVGLGFBQWEsR0FBRyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtZQUN2QyxJQUFNLGdCQUFnQixHQUFHLDRDQUEyQixDQUNs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