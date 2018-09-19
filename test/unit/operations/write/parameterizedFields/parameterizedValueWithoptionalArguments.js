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
    describe("parameterized value with optional arguments", function () {
        var snapshot, editedNodeIds, parameterizedId;
        beforeAll(function () {
            var parameterizedQuery = helpers_1.query("query getAFoo($one: Number, $two: String) {\n          foo(a: $one, b:$two)\n        }", { one: 1 });
            parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['foo'], { a: 1, b: null });
            var result = write_1.write(context, empty, parameterizedQuery, { foo: 'hello' });
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("writes a node for the field", function () {
            expect(snapshot.getNodeData(parameterizedId)).to.deep.eq('hello');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVyaXplZFZhbHVlV2l0aG9wdGlvbmFsQXJndW1lbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGFyYW1ldGVyaXplZFZhbHVlV2l0aG9wdGlvbmFsQXJndW1lbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMEJBQTRCO0FBRTVCLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsa0RBQXNFO0FBQ3RFLCtFQUEyRjtBQUMzRiw2REFBNEQ7QUFDNUQsb0RBQWlFO0FBQ2pFLCtDQUEwRDtBQUVsRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBRTNCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFFbEMsUUFBUSxDQUFDLDZDQUE2QyxFQUFFO1FBRXRELElBQUksUUFBdUIsRUFBRSxhQUEwQixFQUFFLGVBQXVCLENBQUM7UUFDakYsU0FBUyxDQUFDO1lBQ1IsSUFBTSxrQkFBa0IsR0FBRyxlQUFLLENBQzlCLHdGQUVFLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQ2YsQ0FBQztZQUVGLGVBQWUsR0FBRyw0Q0FBMkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFdkYsSUFBTSxNQUFNLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUMzRSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUMzQixhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2QkFBNkIsRUFBRTtZQUNoQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDBEQUEwRCxFQUFFO1lBQzdELElBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFFLENBQUM7WUFDekQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx1REFBdUQsRUFBRTtZQUMxRCxJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBRSxDQUFDO1lBQzFELE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMscUVBQXFFLEVBQUU7WUFDeEUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDM0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsb0NBQW9DLEVBQUU7WUFDdkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDdkUsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsb0NBQW9DLEVBQUU7WUFDdkMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsa0NBQTBCLENBQUMsQ0FBQztRQUNwRyxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==