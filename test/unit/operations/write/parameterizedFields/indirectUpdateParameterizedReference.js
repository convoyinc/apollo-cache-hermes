"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
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
    describe("indirectly updates parameterized reference", function () {
        var baseline, snapshot, editedNodeIds, parameterizedId;
        beforeAll(function () {
            var viewerQuery = helpers_1.query("{\n        viewer {\n          id\n          name\n        }\n      }");
            var parameterizedQuery = helpers_1.query("query getAFoo($id: ID!) {\n        foo(id: $id, withExtra: true) {\n          id name extra\n        }\n      }", { id: 1 });
            parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });
            var baselineResult = write_1.write(context, empty, parameterizedQuery, {
                foo: {
                    id: 1,
                    name: 'Foo',
                    extra: false,
                },
            });
            baseline = baselineResult.snapshot;
            var result = write_1.write(context, baseline, viewerQuery, {
                viewer: {
                    id: 1,
                    name: 'Foo Bar',
                },
            });
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("updates the node for the field", function () {
            expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({ id: 1, name: 'Foo Bar', extra: false });
        });
        it("ensures normalized references", function () {
            var entity = snapshot.getNodeData('1');
            expect(snapshot.getNodeData(QueryRootId).viewer).to.eq(entity);
            expect(snapshot.getNodeData(parameterizedId)).to.eq(entity);
        });
        it("marks only the entity as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kaXJlY3RVcGRhdGVQYXJhbWV0ZXJpemVkUmVmZXJlbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW5kaXJlY3RVcGRhdGVQYXJhbWV0ZXJpemVkUmVmZXJlbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0RBQTBEO0FBQzFELGtFQUFpRTtBQUNqRSwrRUFBMkY7QUFDM0YsNkRBQTREO0FBQzVELG9EQUFpRTtBQUNqRSwrQ0FBMEQ7QUFFbEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBRWxDLFFBQVEsQ0FBQyw0Q0FBNEMsRUFBRTtRQUVyRCxJQUFJLFFBQXVCLEVBQUUsUUFBdUIsRUFBRSxhQUEwQixFQUFFLGVBQXVCLENBQUM7UUFDMUcsU0FBUyxDQUFDO1lBQ1IsSUFBTSxXQUFXLEdBQUcsZUFBSyxDQUFDLHVFQUt4QixDQUFDLENBQUM7WUFFSixJQUFNLGtCQUFrQixHQUFHLGVBQUssQ0FBQyxpSEFJL0IsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRWYsZUFBZSxHQUFHLDRDQUEyQixDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVoRyxJQUFNLGNBQWMsR0FBRyxhQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRTtnQkFDL0QsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxDQUFDO29CQUNMLElBQUksRUFBRSxLQUFLO29CQUNYLEtBQUssRUFBRSxLQUFLO2lCQUNiO2FBQ0YsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUM7WUFFbkMsSUFBTSxNQUFNLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFO2dCQUNuRCxNQUFNLEVBQUU7b0JBQ04sRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLFNBQVM7aUJBQ2hCO2FBQ0YsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDM0IsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsZ0NBQWdDLEVBQUU7WUFDbkMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNyRyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywrQkFBK0IsRUFBRTtZQUNsQyxJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGlDQUFpQyxFQUFFO1lBQ3BDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4RSxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==