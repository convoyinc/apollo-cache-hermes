"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.restore", function () {
    describe("nested parameterized references in array", function () {
        var parameterizedId0 = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two', 0, 'three'], { id: 1, withExtra: true });
        var parameterizedId1 = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two', 1, 'three'], { id: 1, withExtra: true });
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            originalGraphSnapshot = helpers_1.createGraphSnapshot({
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
            restoreGraphSnapshot = operations_1.restore((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [
                        { id: parameterizedId0, path: ['one', 'two', 0, 'three'] },
                        { id: parameterizedId1, path: ['one', 'two', 1, 'three'] },
                    ],
                    data: {
                        one: {
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
        it("restores parameterized NodeSnapshot in an array at index=0 from JSON serialization object", function () {
            var parameterizedElement0 = restoreGraphSnapshot.getNodeSnapshot(parameterizedId0);
            var entityElement0 = restoreGraphSnapshot.getNodeData('30');
            expect(parameterizedElement0.inbound).to.have.deep.members([{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }]);
            expect(parameterizedElement0.outbound).to.have.deep.members([{ id: '30', path: [] }]);
            expect(parameterizedElement0.data).to.eq(entityElement0);
        });
        it("restores parameterized NodeSnapshot at index=1 from JSON serialization object", function () {
            var parameterizedElement1 = restoreGraphSnapshot.getNodeSnapshot(parameterizedId1);
            var entityElement1 = restoreGraphSnapshot.getNodeData('31');
            expect(parameterizedElement1).to.be.an.instanceof(nodes_1.ParameterizedValueSnapshot);
            expect(parameterizedElement1.inbound).to.have.deep.members([{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }]);
            expect(parameterizedElement1.outbound).to.have.deep.members([{ id: '31', path: [] }]);
            expect(parameterizedElement1.data).to.eq(entityElement1);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZUluQXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXN0ZWRQYXJhbWV0ZXJpemVkUmVmZXJlbmNlSW5BcnJheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLGtEQUFzRjtBQUN0Riw0REFBd0Q7QUFDeEQsK0VBQTJGO0FBQzNGLG9EQUF1RTtBQUN2RSwrQ0FBb0Y7QUFFNUUsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQywwQ0FBMEMsRUFBRTtRQUVuRCxJQUFNLGdCQUFnQixHQUFHLDRDQUEyQixDQUNsRCxXQUFXLEVBQ1gsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsRUFDMUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FDM0IsQ0FBQztRQUVGLElBQU0sZ0JBQWdCLEdBQUcsNENBQTJCLENBQ2xELFdBQVcsRUFDWCxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxFQUMxQixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUMzQixDQUFDO1FBRUYsSUFBSSxvQkFBbUMsRUFBRSxxQkFBb0MsQ0FBQztRQUM5RSxTQUFTLENBQUM7WUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1lBQ2hELHFCQUFxQixHQUFHLDZCQUFtQixDQUN6QztnQkFDRSxHQUFHLEVBQUU7b0JBQ0gsR0FBRyxFQUFFO3dCQUNIOzRCQUNFLEtBQUssRUFBRTtnQ0FDTCxFQUFFLEVBQUUsSUFBSTtnQ0FDUixJQUFJLEVBQUUsUUFBUTtnQ0FDZCxVQUFVLEVBQUUsT0FBTzs2QkFDcEI7eUJBQ0Y7d0JBQ0Q7NEJBQ0UsS0FBSyxFQUFFO2dDQUNMLEVBQUUsRUFBRSxJQUFJO2dDQUNS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