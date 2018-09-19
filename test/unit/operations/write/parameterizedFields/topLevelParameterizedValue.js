"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var nodes_1 = require("../../../../../src/nodes");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var write_1 = require("../../../../../src/operations/write");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe("operations.write", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    describe("top-level parameterized value", function () {
        var snapshot, editedNodeIds, parameterizedId;
        beforeAll(function () {
            var parameterizedQuery = helpers_1.query("query getAFoo($id: ID!) {\n        foo(id: $id, withExtra: true) {\n          name extra\n        }\n      }", { id: 1 });
            parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });
            var result = write_1.write(context, empty, parameterizedQuery, {
                foo: {
                    name: 'Foo',
                    extra: false,
                },
            });
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("writes a node for the field", function () {
            expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({ name: 'Foo', extra: false });
        });
        it("creates an outgoing reference from the field's container", function () {
            var queryRoot = snapshot.getNodeSnapshot(QueryRootId);
            expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: ['foo'] }]);
        });
        it("creates an inbound reference to the field's container", function () {
            var values = snapshot.getNodeSnapshot(parameterizedId);
            expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: ['foo'] }]);
        });
        it("does not expose the parameterized field directly from its container", function () {
            expect(_.get(snapshot.getNodeData(QueryRootId), 'foo')).to.eq(undefined);
        });
        it("marks only the new field as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
        });
        it("emits a ParameterizedValueSnapshot", function () {
            expect(snapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceOf(nodes_1.ParameterizedValueSnapshot);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9wTGV2ZWxQYXJhbWV0ZXJpemVkVmFsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0b3BMZXZlbFBhcmFtZXRlcml6ZWRWYWx1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDBCQUE0QjtBQUU1QixzREFBMEQ7QUFDMUQsa0VBQWlFO0FBQ2pFLGtEQUFzRTtBQUN0RSwrRUFBMkY7QUFDM0YsNkRBQTREO0FBQzVELG9EQUFpRTtBQUNqRSwrQ0FBMEQ7QUFFbEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBRWxDLFFBQVEsQ0FBQywrQkFBK0IsRUFBRTtRQUV4QyxJQUFJLFFBQXVCLEVBQUUsYUFBMEIsRUFBRSxlQUF1QixDQUFDO1FBQ2pGLFNBQVMsQ0FBQztZQUNSLElBQU0sa0JBQWtCLEdBQUcsZUFBSyxDQUFDLDhHQUkvQixFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFZixlQUFlLEdBQUcsNENBQTJCLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRWhHLElBQU0sTUFBTSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFO2dCQUN2RCxHQUFHLEVBQUU7b0JBQ0gsSUFBSSxFQUFFLEtBQUs7b0JBQ1gsS0FBSyxFQUFFLEtBQUs7aUJBQ2I7YUFDRixDQUFDLENBQUM7WUFDSCxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUMzQixhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2QkFBNkIsRUFBRTtZQUNoQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMxRixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywwREFBMEQsRUFBRTtZQUM3RCxJQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBRSxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsdURBQXVELEVBQUU7WUFDMUQsSUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUUsQ0FBQztZQUMxRCxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHFFQUFxRSxFQUFFO1lBQ3hFLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzNFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFO1lBQ3ZDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQ3ZFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFO1lBQ3ZDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLGtDQUEwQixDQUFDLENBQUM7UUFDcEcsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=