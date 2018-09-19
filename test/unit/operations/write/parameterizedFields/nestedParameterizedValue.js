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
    describe("nested parameterzied values", function () {
        var snapshot, editedNodeIds, parameterizedId;
        beforeAll(function () {
            var parameterizedQuery = helpers_1.query("query getAFoo($id: ID!) {\n        foo {\n          bar {\n            baz(id: $id, withExtra: true) {\n              name extra\n            }\n          }\n        }\n      }", { id: 1 });
            parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['foo', 'bar', 'baz'], { id: 1, withExtra: true });
            var result = write_1.write(context, empty, parameterizedQuery, {
                foo: {
                    bar: {
                        baz: {
                            name: 'Foo',
                            extra: false,
                        },
                    },
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
            expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: ['foo', 'bar', 'baz'] }]);
        });
        it("creates an inbound reference to the field's container", function () {
            var values = snapshot.getNodeSnapshot(parameterizedId);
            expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: ['foo', 'bar', 'baz'] }]);
        });
        it("does not expose the parameterized field directly from its container", function () {
            expect(_.get(snapshot.getNodeData(QueryRootId), 'foo.bar.baz')).to.eq(undefined);
        });
        it("marks only the new field as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
        });
        it("emits a ParameterizedValueSnapshot", function () {
            expect(snapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceOf(nodes_1.ParameterizedValueSnapshot);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMEJBQTRCO0FBRTVCLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsa0RBQXNFO0FBQ3RFLCtFQUEyRjtBQUMzRiw2REFBNEQ7QUFDNUQsb0RBQWlFO0FBQ2pFLCtDQUEwRDtBQUVsRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBRTNCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFFbEMsUUFBUSxDQUFDLDZCQUE2QixFQUFFO1FBRXRDLElBQUksUUFBdUIsRUFBRSxhQUEwQixFQUFFLGVBQXVCLENBQUM7UUFDakYsU0FBUyxDQUFDO1lBQ1IsSUFBTSxrQkFBa0IsR0FBRyxlQUFLLENBQUMsa0xBUS9CLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVmLGVBQWUsR0FBRyw0Q0FBMkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUU5RyxJQUFNLE1BQU0sR0FBRyxhQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRTtnQkFDdkQsR0FBRyxFQUFFO29CQUNILEdBQUcsRUFBRTt3QkFDSCxHQUFHLEVBQUU7NEJBQ0gsSUFBSSxFQUFFLEtBQUs7NEJBQ1gsS0FBSyxFQUFFLEtBQUs7eUJBQ2I7cUJBQ0Y7aUJBQ0Y7YUFDRixDQUFDLENBQUM7WUFDSCxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUMzQixhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2QkFBNkIsRUFBRTtZQUNoQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMxRixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywwREFBMEQsRUFBRTtZQUM3RCxJQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBRSxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNoRyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx1REFBdUQsRUFBRTtZQUMxRCxJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBRSxDQUFDO1lBQzFELE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4RixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxxRUFBcUUsRUFBRTtZQUN4RSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtZQUN2QyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUN2RSxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtZQUN2QyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxrQ0FBMEIsQ0FBQyxDQUFDO1FBQ3BHLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9