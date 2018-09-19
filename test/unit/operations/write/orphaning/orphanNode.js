"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
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
    var rootValuesQuery = helpers_1.query("{\n    foo {\n      id\n      name\n    }\n    bar {\n      id\n      name\n    }\n  }");
    describe("orphans a node", function () {
        var baseline, snapshot, editedNodeIds;
        beforeAll(function () {
            var baselineResult = write_1.write(context, empty, rootValuesQuery, {
                foo: { id: 1, name: 'Foo' },
                bar: { id: 2, name: 'Bar' },
            });
            baseline = baselineResult.snapshot;
            var result = write_1.write(context, baseline, helpers_1.query("{ bar { id } }"), {
                bar: null,
            });
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("replaces the reference with null", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                foo: { id: 1, name: 'Foo' },
                bar: null,
            });
        });
        it("updates outbound references", function () {
            var queryRoot = snapshot.getNodeSnapshot(QueryRootId);
            expect(queryRoot.outbound).to.have.deep.members([{ id: '1', path: ['foo'] }]);
        });
        it("marks the container and orphaned node as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '2']);
        });
        it("contains the correct nodes", function () {
            expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JwaGFuTm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9ycGhhbk5vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzREFBMEQ7QUFDMUQsa0VBQWlFO0FBQ2pFLDZEQUE0RDtBQUM1RCxvREFBaUU7QUFDakUsK0NBQTBEO0FBRWxELElBQUEsNkNBQXNCLENBQWtCO0FBRWhELGdGQUFnRjtBQUNoRixFQUFFO0FBQ0YsNkVBQTZFO0FBQzdFLGdGQUFnRjtBQUNoRixRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFFM0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyxJQUFNLEtBQUssR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztJQUNsQyxJQUFNLGVBQWUsR0FBRyxlQUFLLENBQUMsd0ZBUzVCLENBQUMsQ0FBQztJQUVKLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRTtRQUN6QixJQUFJLFFBQXVCLEVBQUUsUUFBdUIsRUFBRSxhQUEwQixDQUFDO1FBQ2pGLFNBQVMsQ0FBQztZQUNSLElBQU0sY0FBYyxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRTtnQkFDNUQsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO2dCQUMzQixHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7YUFDNUIsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUM7WUFFbkMsSUFBTSxNQUFNLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsZUFBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUU7Z0JBQy9ELEdBQUcsRUFBRSxJQUFJO2FBQ1YsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDM0IsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsa0NBQWtDLEVBQUU7WUFDckMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO2dCQUMzQixHQUFHLEVBQUUsSUFBSTthQUNWLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDZCQUE2QixFQUFFO1lBQ2hDLElBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFFLENBQUM7WUFDekQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsaURBQWlELEVBQUU7WUFDcEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDRCQUE0QixFQUFFO1lBQy9CLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9