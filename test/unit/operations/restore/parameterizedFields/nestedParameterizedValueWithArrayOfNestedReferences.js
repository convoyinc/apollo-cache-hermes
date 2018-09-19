"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.restore", function () {
    describe("nested parameterized value with array of nested references", function () {
        var parameterizedTopContainerId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
        var nestedParameterizedValueId0 = SnapshotEditor_1.nodeIdForParameterizedValue('31', ['four'], { extra: true });
        var nestedParameterizedValueId1 = SnapshotEditor_1.nodeIdForParameterizedValue('32', ['four'], { extra: true });
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            originalGraphSnapshot = helpers_1.createGraphSnapshot({
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
            restoreGraphSnapshot = operations_1.restore((_a = {},
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
                    data: [{}, {}, null],
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
                _a[nestedParameterizedValueId1] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: '32', path: ['four'] }],
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
                _a), cacheContext).cacheSnapshot.baseline;
            var _a;
        });
        it("restores GraphSnapshot from JSON serializable object", function () {
            expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
        });
        it("correctly restores different types of NodeSnapshot", function () {
            expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedTopContainerId)).to.be.an.instanceof(nodes_1.ParameterizedValueSnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot(nestedParameterizedValueId0)).to.be.an.instanceof(nodes_1.ParameterizedValueSnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot('31')).to.be.an.instanceof(nodes_1.EntitySnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot(nestedParameterizedValueId1)).to.be.an.instanceof(nodes_1.ParameterizedValueSnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot('32')).to.be.an.instanceof(nodes_1.EntitySnapshot);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlV2l0aEFycmF5T2ZOZXN0ZWRSZWZlcmVuY2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlV2l0aEFycmF5T2ZOZXN0ZWRSZWZlcmVuY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esa0RBQXNGO0FBQ3RGLDREQUF3RDtBQUN4RCwrRUFBMkY7QUFDM0Ysb0RBQXVFO0FBQ3ZFLCtDQUFvRjtBQUU1RSxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLDREQUE0RCxFQUFFO1FBRXJFLElBQU0sMkJBQTJCLEdBQUcsNENBQTJCLENBQzdELFdBQVcsRUFDWCxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFDZCxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FDVixDQUFDO1FBRUYsSUFBTSwyQkFBMkIsR0FBRyw0Q0FBMkIsQ0FDN0QsSUFBSSxFQUNKLENBQUMsTUFBTSxDQUFDLEVBQ1IsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQ2hCLENBQUM7UUFFRixJQUFNLDJCQUEyQixHQUFHLDRDQUEyQixDQUM3RCxJQUFJLEVBQ0osQ0FBQyxNQUFNLENBQUMsRUFDUixFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FDaEIsQ0FBQztRQUVGLElBQUksb0JBQW1DLEVBQUUscUJBQW9DLENBQUM7UUFDOUUsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztZQUNoRCxxQkFBcUIsR0FBRyw2QkFBbUIsQ0FDekM7Z0JBQ0UsR0FBRyxFQUFFO29CQUNILEdBQUcsRUFBRTt3QkFDSDs0QkFDRSxLQUFLLEVBQUU7Z0NBQ0wsRUFBRSxFQUFFLEVBQUU7Z0NBQ04sSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTs2QkFDbEI7eUJBQ0Y7d0JBQ0Q7NEJB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