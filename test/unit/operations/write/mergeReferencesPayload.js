"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../src/context");
var GraphSnapshot_1 = require("../../../../src/GraphSnapshot");
var EntitySnapshot_1 = require("../../../../src/nodes/EntitySnapshot");
var write_1 = require("../../../../src/operations/write");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe("operations.write", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    describe("merge references payload", function () {
        var baseline, snapshot, editedNodeIds;
        beforeAll(function () {
            var rootValuesQuery = helpers_1.query("{\n        foo {\n          id\n          name\n        }\n        bar {\n          id\n          name\n          extra\n        }\n      }");
            var rootMergeQuery = helpers_1.query("{\n        foo {\n          id\n          name\n        }\n        bar {\n          id\n          extra\n        }\n      }");
            var baselineResult = write_1.write(context, empty, rootValuesQuery, {
                foo: { id: 1, name: 'Foo' },
                bar: { id: 2, name: 'Bar', extra: null },
            });
            baseline = baselineResult.snapshot;
            var result = write_1.write(context, baseline, rootMergeQuery, {
                foo: { id: 1, name: 'Foo Boo' },
                bar: { id: 2, extra: true },
            });
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("updates existing values in referenced nodes", function () {
            expect(snapshot.getNodeData('1')).to.deep.eq({ id: 1, name: 'Foo Boo' });
        });
        it("inserts new values in referenced nodes", function () {
            expect(snapshot.getNodeData('2')).to.deep.eq({ id: 2, name: 'Bar', extra: true });
        });
        it("updates references to the newly edited nodes", function () {
            var root = snapshot.getNodeData(QueryRootId);
            expect(root.foo).to.eq(snapshot.getNodeData('1'));
            expect(root.bar).to.eq(snapshot.getNodeData('2'));
        });
        it("doesn't mark regenerated nodes as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members(['1', '2']);
        });
        it("contains the correct nodes", function () {
            expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1', '2']);
        });
        it("emits the edited nodes as an EntitySnapshot", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot_1.EntitySnapshot);
            expect(snapshot.getNodeSnapshot('1')).to.be.an.instanceOf(EntitySnapshot_1.EntitySnapshot);
            expect(snapshot.getNodeSnapshot('2')).to.be.an.instanceOf(EntitySnapshot_1.EntitySnapshot);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VSZWZlcmVuY2VzUGF5bG9hZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lcmdlUmVmZXJlbmNlc1BheWxvYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtREFBdUQ7QUFDdkQsK0RBQThEO0FBQzlELHVFQUFzRTtBQUN0RSwwREFBeUQ7QUFDekQsaURBQThEO0FBQzlELDRDQUF1RDtBQUUvQyxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBRTNCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFFbEMsUUFBUSxDQUFDLDBCQUEwQixFQUFFO1FBRW5DLElBQUksUUFBdUIsRUFBRSxRQUF1QixFQUFFLGFBQTBCLENBQUM7UUFDakYsU0FBUyxDQUFDO1lBQ1IsSUFBTSxlQUFlLEdBQUcsZUFBSyxDQUFDLDZJQVU1QixDQUFDLENBQUM7WUFDSixJQUFNLGNBQWMsR0FBRyxlQUFLLENBQUMsNkhBUzNCLENBQUMsQ0FBQztZQUVKLElBQU0sY0FBYyxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRTtnQkFDNUQsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO2dCQUMzQixHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTthQUN6QyxDQUFDLENBQUM7WUFDSCxRQUFRLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQztZQUVuQyxJQUFNLE1BQU0sR0FBRyxhQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUU7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