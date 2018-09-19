"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("nested parameterized value", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                one: {
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
            }, "query getAFoo($id: ID!) {\n          one {\n            two {\n              three(id: $id, withExtra: true) {\n                id name extraValue\n              }\n            }\n          }\n        }", cacheContext, { id: 1 });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZUluQXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXN0ZWRQYXJhbWV0ZXJpemVkUmVmZXJlbmNlSW5BcnJheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlFQUFnRTtBQUNoRSwrRUFBMkY7QUFDM0Ysb0RBQXVFO0FBQ3ZFLCtDQUFvRjtBQUU1RSxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLDRCQUE0QixFQUFFO1FBRXJDLElBQUksYUFBeUMsQ0FBQztRQUM5QyxTQUFTLENBQUM7WUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1lBQ2hELElBQU0sUUFBUSxHQUFHLDZCQUFtQixDQUNsQztnQkFDRSxHQUFHLEVBQUU7b0JBQ0gsR0FBRyxFQUFFO3dCQUNIOzRCQUNFLEtBQUssRUFBRTtnQ0FDTCxFQUFFLEVBQUUsSUFBSTtnQ0FDUixJQUFJLEVBQUUsUUFBUTtnQ0FDZCxVQUFVLEVBQUUsT0FBTzs2QkFDcEI7eUJBQ0Y7d0JBQ0Q7NEJBQ0UsS0FBSyxFQUFFO2dDQUNMLEVBQUUsRUFBRSxJQUFJO2dDQUNSLElBQUksRUFBRSxRQUFRO2dDQUNkLFVBQVUsRUFBRSxPQUFPOzZCQUNwQjt5QkFDRjt3QkFDRCxJQUFJO3FCQUNMO2lCQUNGO2FBQ0YsRUFDRCw0TUFRRSxFQUNGLFlBQVksRUFDWixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FDVixDQUFDO1lBRUYsYUFBYSxHQUFHLGlCQUFPLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFO1lBQ3ZDLElBQU0sZ0JBQWdCLEdBQUcsNENBQTJCLENBQ2xELFdBQVcsRUFDWCxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FB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