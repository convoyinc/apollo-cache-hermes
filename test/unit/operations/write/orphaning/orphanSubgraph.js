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
    describe("orphans a subgraph", function () {
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
    describe("when orphaning a subgraph", function () {
        var baseline, snapshot, editedNodeIds;
        beforeAll(function () {
            var subgraphQuery = helpers_1.query("{\n        foo {\n          id\n          name\n          two {\n            id\n          }\n        }\n        bar {\n          id\n          one {\n            id\n          }\n          two {\n            id\n          }\n          three {\n            id\n            foo {\n              id\n            }\n          }\n        }\n      }");
            var baselineResult = write_1.write(context, empty, subgraphQuery, {
                foo: {
                    id: 1,
                    name: 'Foo',
                    two: { id: 222 },
                },
                bar: {
                    id: 2,
                    one: { id: 111 },
                    two: { id: 222 },
                    three: {
                        id: 333,
                        foo: { id: 1 },
                    },
                },
            });
            baseline = baselineResult.snapshot;
            var result = write_1.write(context, baseline, subgraphQuery, {
                foo: {
                    id: 1,
                    name: 'Foo',
                    two: null,
                },
                bar: null,
            });
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("replaces the reference with null", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                foo: {
                    id: 1,
                    name: 'Foo',
                    two: null,
                },
                bar: null,
            });
        });
        it("preserves nodes that only lost some of their inbound references", function () {
            expect(snapshot.getNodeData('1')).to.deep.eq({ id: 1, name: 'Foo', two: null });
        });
        it("updates outbound references", function () {
            var queryRoot = snapshot.getNodeSnapshot(QueryRootId);
            expect(queryRoot.outbound).to.have.deep.members([{ id: '1', path: ['foo'] }]);
        });
        it("marks the container and all orphaned nodes as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1', '2', '111', '222', '333']);
        });
        it("contains the correct nodes", function () {
            expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JwaGFuU3ViZ3JhcGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvcnBoYW5TdWJncmFwaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsNkRBQTREO0FBQzVELG9EQUFpRTtBQUNqRSwrQ0FBMEQ7QUFFbEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBQ2xDLElBQU0sZUFBZSxHQUFHLGVBQUssQ0FBQyx3RkFTNUIsQ0FBQyxDQUFDO0lBRUosUUFBUSxDQUFDLG9CQUFvQixFQUFFO1FBQzdCLElBQUksUUFBdUIsRUFBRSxRQUF1QixFQUFFLGFBQTBCLENBQUM7UUFDakYsU0FBUyxDQUFDO1lBQ1IsSUFBTSxjQUFjLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFO2dCQUM1RCxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7Z0JBQzNCLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTthQUM1QixDQUFDLENBQUM7WUFDSCxRQUFRLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQztZQUVuQyxJQUFNLE1BQU0sR0FBRyxhQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxlQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtnQkFDL0QsR0FBRyxFQUFFLElBQUk7YUFDVixDQUFDLENBQUM7WUFDSCxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUMzQixhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxrQ0FBa0MsRUFBRTtZQUNyQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7Z0JBQzNCLEdBQUcsRUFBRSxJQUFJO2FBQ1YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkJBQTZCLEVBQUU7WUFDaEMsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUUsQ0FBQztZQUN6RCxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNoRixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxpREFBaUQsRUFBRTtZQUNwRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNEJBQTRCLEVBQUU7WUFDL0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQywyQkFBMkIsRUFBRTtRQUNwQyxJQUFJLFFBQXVCLEVBQUUsUUFBdUIsRUFBRSxhQUEwQixDQUFDO1FBQ2pGLFNBQVMsQ0FBQztZQUNSLElBQU0sYUFBYSxHQUFHLGVBQUssQ0FBQywwVkF1QjFCLENBQUMsQ0FBQztZQUNKLElBQU0sY0FBYyxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRTtnQkFDMUQsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxDQUFDO29CQUNMLElBQUksRUFBRSxLQUFLO29CQUNYLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUU7aUJBQ2pCO2dCQUNELEdBQUcsRUFBRTtvQkFDSCxFQUFFLEVBQUUsQ0FBQztvQkFDTCxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFO29CQUNoQixHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFO29CQUNoQixLQUFLLEVBQUU7d0JBQ0wsRUFBRSxFQUFFLEdBQUc7d0JBQ1AsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtxQkFDZjtpQkFDRjthQUNGLENBQUMsQ0FBQztZQUNILFFBQVEsR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDO1lBRW5DLElBQU0sTUFBTSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRTtnQkFDckQsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxDQUFDO29CQUNMLElBQUksRUFBRSxLQUFLO29CQUNYLEdBQUcsRUFBRSxJQUFJO2lCQUNWO2dCQUNELEdBQUcsRUFBRSxJQUFJO2FBQ1YsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDM0IsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsa0NBQWtDLEVBQUU7WUFDckMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxDQUFDO29CQUNMLElBQUksRUFBRSxLQUFLO29CQUNYLEdBQUcsRUFBRSxJQUFJO2lCQUNWO2dCQUNELEdBQUcsRUFBRSxJQUFJO2FBQ1YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsaUVBQWlFLEVBQUU7WUFDcEUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNsRixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2QkFBNkIsRUFBRTtZQUNoQyxJQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBRSxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHNEQUFzRCxFQUFFO1lBQ3pELE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDbEcsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNEJBQTRCLEVBQUU7WUFDL0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=