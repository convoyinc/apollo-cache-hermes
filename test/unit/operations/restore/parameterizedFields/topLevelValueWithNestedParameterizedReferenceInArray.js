"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.restore", function () {
    describe("top-level values wtih nested parameterized value in an array", function () {
        var parameterizedId0 = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two', 0, 'three'], { id: 1, withExtra: true });
        var parameterizedId1 = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two', 1, 'three'], { id: 1, withExtra: true });
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            originalGraphSnapshot = helpers_1.createGraphSnapshot({
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
            restoreGraphSnapshot = operations_1.restore((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [
                        { id: parameterizedId0, path: ['one', 'two', 0, 'three'] },
                        { id: parameterizedId1, path: ['one', 'two', 1, 'three'] },
                    ],
                    data: {
                        one: {
                            four: 'FOUR',
                            two: [null, null, null],
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
                _a), cacheContext).cacheSnapshot.baseline;
            var _a;
        });
        it("restores GraphSnapshot from JSON serializable object", function () {
            expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
        });
        it("correctly restores different types of NodeSnapshot", function () {
            expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedId0)).to.be.an.instanceof(nodes_1.ParameterizedValueSnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot('30')).to.be.an.instanceOf(nodes_1.EntitySnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedId1)).to.be.an.instanceof(nodes_1.ParameterizedValueSnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot('31')).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9wTGV2ZWxWYWx1ZVdpdGhOZXN0ZWRQYXJhbWV0ZXJpemVkUmVmZXJlbmNlSW5BcnJheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRvcExldmVsVmFsdWVXaXRoTmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZUluQXJyYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxrREFBc0Y7QUFDdEYsNERBQXdEO0FBQ3hELCtFQUEyRjtBQUMzRixvREFBdUU7QUFDdkUsK0NBQW9GO0FBRTVFLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtJQUM3QixRQUFRLENBQUMsOERBQThELEVBQUU7UUFFdkUsSUFBTSxnQkFBZ0IsR0FBRyw0Q0FBMkIsQ0FDbEQsV0FBVyxFQUNYLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLEVBQzFCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQzNCLENBQUM7UUFFRixJQUFNLGdCQUFnQixHQUFHLDRDQUEyQixDQUNsRCxXQUFXLEVBQ1gsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsRUFDMUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FDM0IsQ0FBQztRQUVGLElBQUksb0JBQW1DLEVBQUUscUJBQW9DLENBQUM7UUFDOUUsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztZQUNoRCxxQkFBcUIsR0FBRyw2QkFBbUIsQ0FDekM7Z0JBQ0UsR0FBRyxFQUFFO29CQUNILElBQUksRUFBRSxNQUFNO29CQUNaLEdBQUcsRUFBRTt3QkFDSDs0QkFDRSxLQUFLLEVBQUU7Z0NBQ0wsRUFBRSxFQUFFLElBQUk7Z0NBQ1IsSUFBSSxFQUFFLFFBQVE7Z0NBQ2QsVUFBVSxFQUFFLE9BQU87NkJBQ3BC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RSxDQUFDLFVBQVUsQ0FBQyxzQkFBYyxDQUFDLENBQUM7WUFDOUYsTUFBTSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLGtDQUEwQixDQUFDLENBQUM7WUFDL0csTUFBTSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxzQkFBYyxDQUFDLENBQUM7WUFDdkYsTUFBTSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLGtDQUEwQixDQUFDLENBQUM7WUFDL0csTUFBTSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxzQkFBYyxDQUFDLENBQUM7UUFDekYsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=