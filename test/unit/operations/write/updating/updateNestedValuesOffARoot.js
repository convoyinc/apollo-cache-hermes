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
    var valuesQuery = helpers_1.query("{ foo bar }");
    describe("updates nested values hanging off of a root", function () {
        var baseline, snapshot, editedNodeIds;
        beforeAll(function () {
            var baselineResult = write_1.write(context, empty, valuesQuery, {
                foo: [{ value: 1 }, { value: 2 }, { value: 3 }],
                bar: { baz: 'asdf' },
            });
            baseline = baselineResult.snapshot;
            var result = write_1.write(context, baseline, valuesQuery, {
                foo: [{ value: -1 }, { extra: true }],
                bar: {
                    baz: 'fdsa',
                    fizz: 'buzz',
                },
            });
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("merges new properties with existing objects", function () {
            expect(snapshot.getNodeData(QueryRootId).bar).to.deep.eq({ baz: 'fdsa', fizz: 'buzz' });
        });
        it("honors array lengths", function () {
            expect(snapshot.getNodeData(QueryRootId).foo.length).to.eq(2);
        });
        it("overwrites previous values in array elements", function () {
            expect(snapshot.getNodeData(QueryRootId).foo[0]).to.deep.eq({ value: -1 });
        });
        it("no merging of new values in array elements as we copy leaf value", function () {
            expect(snapshot.getNodeData(QueryRootId).foo[1]).to.deep.eq({ extra: true });
        });
        it("marks the root as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
        });
        it("only contains the root node", function () {
            expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlTmVzdGVkVmFsdWVzT2ZmQVJvb3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1cGRhdGVOZXN0ZWRWYWx1ZXNPZmZBUm9vdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsNkRBQTREO0FBQzVELG9EQUFpRTtBQUNqRSwrQ0FBMEQ7QUFFbEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBQ2xDLElBQU0sV0FBVyxHQUFHLGVBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUV6QyxRQUFRLENBQUMsNkNBQTZDLEVBQUU7UUFDdEQsSUFBSSxRQUF1QixFQUFFLFFBQXVCLEVBQUUsYUFBMEIsQ0FBQztRQUNqRixTQUFTLENBQUM7WUFDUixJQUFNLGNBQWMsR0FBRyxhQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7Z0JBQ3hELEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFO2FBQ3JCLENBQUMsQ0FBQztZQUNILFFBQVEsR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDO1lBRW5DLElBQU0sTUFBTSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtnQkFDbkQsR0FBRyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDckMsR0FBRyxFQUFFO29CQUNILEdBQUcsRUFBRSxNQUFNO29CQUNYLElBQUksRUFBRSxNQUFNO2lCQUNiO2FBQ0YsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDM0IsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUU7WUFDaEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzFGLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHNCQUFzQixFQUFFO1lBQ3pCLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDhDQUE4QyxFQUFFO1lBQ2pELE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3RSxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxrRUFBa0UsRUFBRTtZQUNyRSxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQy9FLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDBCQUEwQixFQUFFO1lBQzdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDZCQUE2QixFQUFFO1lBQ2hDLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=