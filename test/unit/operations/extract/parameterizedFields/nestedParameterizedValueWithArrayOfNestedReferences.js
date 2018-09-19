"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("nested parameterized value with array of nested references", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                one: {
                    two: [
                        {
                            three: {
                                id: 31,
                                four: { five: 1 },
                            },
                        },
                        {
                            three: {
                                id: 32,
                                four: { five: 1 },
                            },
                        },
                        null,
                    ],
                },
            }, "query nested($id: ID!) {\n          one {\n            two(id: $id) {\n              three {\n                id\n                four(extra: true) {\n                  five\n                }\n              }\n            }\n          }\n        }", cacheContext, { id: 1 });
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
            var parameterizedTopContainerId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
            var nestedParameterizedValueId0 = SnapshotEditor_1.nodeIdForParameterizedValue('31', ['four'], { extra: true });
            var nestedParameterizedValueId1 = SnapshotEditor_1.nodeIdForParameterizedValue('32', ['four'], { extra: true });
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [{ id: parameterizedTopContainerId, path: ['one', 'two'] }],
                },
                _a[parameterizedTopContainerId] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two'] }],
                    outbound: [
                        { id: '31', path: [0, 'three'] },
                        { id: '32', path: [1, 'three'] },
                    ],
                    data: [{ three: undefined }, { three: undefined }, null],
                },
                _a['31'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: parameterizedTopContainerId, path: [0, 'three'] }],
                    outbound: [{ id: nestedParameterizedValueId0, path: ['four'] }],
                    data: {
                        id: 31,
                    },
                },
                _a[nestedParameterizedValueId0] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: '31', path: ['four'] }],
                    data: {
                        five: 1,
                    },
                },
                _a['32'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: parameterizedTopContainerId, path: [1, 'three'] }],
                    outbound: [{ id: nestedParameterizedValueId1, path: ['four'] }],
                    data: {
                        id: 32,
                    },
                },
                _a[nestedParameterizedValueId1] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: '32', path: ['four'] }],
                    data: {
                        five: 1,
                    },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlV2l0aEFycmF5T2ZOZXN0ZWRSZWZlcmVuY2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlV2l0aEFycmF5T2ZOZXN0ZWRSZWZlcmVuY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUVBQWdFO0FBQ2hFLCtFQUEyRjtBQUMzRixvREFBdUU7QUFDdkUsK0NBQW9GO0FBRTVFLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtJQUM3QixRQUFRLENBQUMsNERBQTRELEVBQUU7UUFFckUsSUFBSSxhQUF5QyxDQUFDO1FBQzlDLFNBQVMsQ0FBQztZQUNSLElBQU0sWUFBWSxHQUFHLGtDQUF3QixFQUFFLENBQUM7WUFDaEQsSUFBTSxRQUFRLEdBQUcsNkJBQW1CLENBQ2xDO2dCQUNFLEdBQUcsRUFBRTtvQkFDSCxHQUFHLEVBQUU7d0JBQ0g7NEJBQ0UsS0FBSyxFQUFFO2dDQUNMLEVBQUUsRUFBRSxFQUFFO2dDQUNOLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7NkJBQ2xCO3lCQUNGO3dCQUNEOzRCQUNFLEtBQUssRUFBRTtnQ0FDTCxFQUFFLEVBQUUsRUFBRTtnQ0FDTixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFOzZCQUNsQjt5QkFDRjt3QkFDRCxJQUFJO3FCQUNMO2lCQUNGO2FBQ0YsRUFDRCwwUEFXRSxFQUNGLFlBQVksRUFDWixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FDVixDQUFDO1lBRUYsYUFBYSxHQUFHLGlCQUFPLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFO1lBQ3ZDLElBQU0sMkJBQTJCLEdBQUcsNENBQTJCLENBQzdELFdBQVcsRUFDWCxDQUFDLEtBQUssRUFB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