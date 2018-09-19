"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var EntitySnapshot_1 = require("../../../../../src/nodes/EntitySnapshot");
var ParameterizedValueSnapshot_1 = require("../../../../../src/nodes/ParameterizedValueSnapshot");
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
    describe("alias parameterized references", function () {
        var parameterizedId, snapshot;
        beforeAll(function () {
            var aliasQuery = helpers_1.query("\n        query getUser($id: ID!) {\n          superUser: user(id: $id) {\n            id\n            FirstName: name\n          }\n        }\n      ", { id: 4 });
            snapshot = write_1.write(context, empty, aliasQuery, {
                superUser: {
                    id: 4,
                    FirstName: 'Baz',
                },
            }).snapshot;
            parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['user'], { id: 4 });
        });
        it("only writes fields from the schema on simple query with variables", function () {
            expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({
                id: 4,
                name: 'Baz',
            });
        });
        it("checks shape of GraphSnapShot at root query", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId)).to.deep.eq(new EntitySnapshot_1.EntitySnapshot(
            /* data */ undefined, 
            /* inbound */ undefined, [{ id: 'ROOT_QUERY❖["user"]❖{"id":4}', path: ['user'] }]));
        });
        it("checks shape of GraphSnapShot at parameterized root query", function () {
            expect(snapshot.getNodeSnapshot(parameterizedId)).to.deep.eq(new ParameterizedValueSnapshot_1.ParameterizedValueSnapshot({
                id: 4,
                name: 'Baz',
            }, [{ id: 'ROOT_QUERY', path: ['user'] }], [{ id: '4', path: [] }]));
        });
        it("checks shape of GraphSnapShot at the reference", function () {
            expect(snapshot.getNodeSnapshot('4')).to.deep.eq(new EntitySnapshot_1.EntitySnapshot({
                id: 4,
                name: 'Baz',
            }, [{ id: 'ROOT_QUERY❖["user"]❖{"id":4}', path: [] }], 
            /* outbound */ undefined));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXNQYXJhbWV0ZXJpemVkUmVmZXJlbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWxpYXNQYXJhbWV0ZXJpemVkUmVmZXJlbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0RBQTBEO0FBQzFELGtFQUFpRTtBQUNqRSwwRUFBeUU7QUFDekUsa0dBQWlHO0FBQ2pHLCtFQUEyRjtBQUMzRiw2REFBNEQ7QUFDNUQsb0RBQXlEO0FBQ3pELCtDQUEwRDtBQUVsRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBRTNCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFFbEMsUUFBUSxDQUFDLGdDQUFnQyxFQUFFO1FBRXpDLElBQUksZUFBdUIsRUFBRSxRQUF1QixDQUFDO1FBRXJELFNBQVMsQ0FBQztZQUNSLElBQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyx3SkFPeEIsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRWQsUUFBUSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRTtnQkFDM0MsU0FBUyxFQUFFO29CQUNULEVBQUUsRUFBRSxDQUFDO29CQUNMLFNBQVMsRUFBRSxLQUFLO2lCQUNqQjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDWixlQUFlLEdBQUcsNENBQTJCLENBQUMsV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsRixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxtRUFBbUUsRUFBRTtZQUN0RSxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxFQUFFLEVBQUUsQ0FBQztnQkFDTCxJQUFJLEVBQUUsS0FBSzthQUNaLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDZDQUE2QyxFQUFFO1lBQ2hELE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3RELElBQUksK0JBQWM7WUFDaEIsVUFBVSxDQUFDLFNBQVM7WUFDcEIsYUFBYSxDQUFDLFNBQVMsRUFDdkIsQ0FBQyxFQUFFLEVBQUUsRUFBRSw4QkFBOEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQ3pELENBQ0YsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDJEQUEyRCxFQUFFO1lBQzlELE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQzFELElBQUksdURBQTBCLENBQzVCO2dCQUNFLEVBQUUsRUFBRSxDQUFDO2dCQUNMLElBQUksRUFBRSxLQUFLO2FBQ1osRUFDRCxDQUFDLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQ3RDLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUN4QixDQUNGLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxnREFBZ0QsRUFBRTtZQUNuRCxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUM5QyxJQUFJLCtCQUFjLENBQ2hCO2dCQUNFLEVBQUUsRUFBRSxDQUFDO2dCQUNMLElBQUksRUFBRSxLQUFLO2FBQ1osRUFDRCxDQUFDLEVBQUUsRUFBRSxFQUFFLDhCQUE4QixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUNsRCxjQUFjLENBQUMsU0FBUyxDQUN6QixDQUNGLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==