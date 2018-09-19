"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.restore", function () {
    describe("nested parameterized references with parameterized value", function () {
        var parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
        var nestedParameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue('31', ['four'], { extra: true });
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            originalGraphSnapshot = helpers_1.createGraphSnapshot({
                one: {
                    two: {
                        three: {
                            id: 31,
                            four: { five: 1 },
                        },
                    },
                },
            }, "query nested($id: ID!) {\n          one {\n            two(id: $id) {\n              three {\n                id\n                four(extra: true) {\n                  five\n                }\n              }\n            }\n          }\n        }", cacheContext, { id: 1 });
            restoreGraphSnapshot = operations_1.restore((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [{ id: parameterizedId, path: ['one', 'two'] }],
                },
                _a[parameterizedId] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two'] }],
                    outbound: [{ id: '31', path: ['three'] }],
                    data: {},
                },
                _a['31'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: parameterizedId, path: ['three'] }],
                    outbound: [{ id: nestedParameterizedId, path: ['four'] }],
                    data: {
                        id: 31,
                    },
                },
                _a[nestedParameterizedId] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: '31', path: ['four'] }],
                    data: {
                        five: 1,
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
            expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceof(nodes_1.ParameterizedValueSnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot('31')).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
        it("restores parameterized NodeSnapshot from JSON serialization object", function () {
            var parameterizedNode = restoreGraphSnapshot.getNodeSnapshot(parameterizedId);
            var entityData = restoreGraphSnapshot.getNodeData('31');
            expect(parameterizedNode.inbound).to.has.deep.members([{ id: QueryRootId, path: ['one', 'two'] }]);
            expect(parameterizedNode.outbound).to.has.deep.members([{ id: '31', path: ['three'] }]);
            expect(parameterizedNode.data).not.eq(undefined);
            expect(parameterizedNode.data['three']).to.eq(entityData);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZXNXaXRoUGFyYW1ldGVyaXplZFZhbHVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZXNXaXRoUGFyYW1ldGVyaXplZFZhbHVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esa0RBQXNGO0FBQ3RGLDREQUF3RDtBQUN4RCwrRUFBMkY7QUFDM0Ysb0RBQXVFO0FBQ3ZFLCtDQUFvRjtBQUU1RSxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLDBEQUEwRCxFQUFFO1FBRW5FLElBQU0sZUFBZSxHQUFHLDRDQUEyQixDQUNqRCxXQUFXLEVBQ1gsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQ2QsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQ1YsQ0FBQztRQUVGLElBQU0scUJBQXFCLEdBQUcsNENBQTJCLENBQ3ZELElBQUksRUFDSixDQUFDLE1BQU0sQ0FBQyxFQUNSLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUNoQixDQUFDO1FBRUYsSUFBSSxvQkFBbUMsRUFBRSxxQkFBb0MsQ0FBQztRQUM5RSxTQUFTLENBQUM7WUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1lBQ2hELHFCQUFxQixHQUFHLDZCQUFtQixDQUN6QztnQkFDRSxHQUFHLEVBQUU7b0JBQ0gsR0FBRyxFQUFFO3dCQUNILEtBQUssRUFBRTs0QkFDTCxFQUFFLEVBQUUsRUFBRTs0QkFDTixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO3lCQUNsQjtxQkFDRjtpQkFDRjthQUNGLEVBQ0QsMFBBV0UsRUFDRixZQUFZLEVBQ1osRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQ1YsQ0FBQztZQUVGLG9CQUFvQixHQUFHLG9CQUFPO2dCQUM1QixHQUFDLFdBQVcsSUFBRztv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