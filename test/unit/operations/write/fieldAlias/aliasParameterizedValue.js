"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var EntitySnapshot_1 = require("../../../../../src/nodes/EntitySnapshot");
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
    describe("alias parameterized field", function () {
        var parameterizedId, snapshot;
        beforeAll(function () {
            var aliasQuery = helpers_1.query("{\n        superUser: user(id: 4) {\n          ID: id\n          FirstName: name\n        }\n      }");
            snapshot = write_1.write(context, empty, aliasQuery, {
                superUser: {
                    ID: 0,
                    FirstName: 'Baz',
                },
            }).snapshot;
            parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['user'], { id: 4 });
        });
        it("only writes fields from the schema on simple query", function () {
            expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({
                id: 0,
                name: 'Baz',
            });
        });
        it("checks shape of GraphSnapShot at root query", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId)).to.deep.eq(new EntitySnapshot_1.EntitySnapshot(
            /* data */ undefined, 
            /* inbound */ undefined, [{ id: 'ROOT_QUERY❖["user"]❖{"id":4}', path: ['user'] }]));
        });
        it("checks shape of GraphSnapShot at parameterized root query", function () {
            expect(snapshot.getNodeSnapshot(parameterizedId)).to.deep.eq(new EntitySnapshot_1.EntitySnapshot({
                id: 0,
                name: 'Baz',
            }, [{ id: 'ROOT_QUERY', path: ['user'] }], 
            /* outbound */ undefined));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXNQYXJhbWV0ZXJpemVkVmFsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhbGlhc1BhcmFtZXRlcml6ZWRWYWx1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsMEVBQXlFO0FBQ3pFLCtFQUEyRjtBQUMzRiw2REFBNEQ7QUFDNUQsb0RBQXlEO0FBQ3pELCtDQUEwRDtBQUVsRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBRTNCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFFbEMsUUFBUSxDQUFDLDJCQUEyQixFQUFFO1FBRXBDLElBQUksZUFBdUIsRUFBRSxRQUF1QixDQUFDO1FBQ3JELFNBQVMsQ0FBQztZQUNSLElBQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyxzR0FLdkIsQ0FBQyxDQUFDO1lBRUosUUFBUSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRTtnQkFDM0MsU0FBUyxFQUFFO29CQUNULEVBQUUsRUFBRSxDQUFDO29CQUNMLFNBQVMsRUFBRSxLQUFLO2lCQUNqQjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFFWixlQUFlLEdBQUcsNENBQTJCLENBQUMsV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsRixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvREFBb0QsRUFBRTtZQUN2RCxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxFQUFFLEVBQUUsQ0FBQztnQkFDTCxJQUFJLEVBQUUsS0FBSzthQUNaLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDZDQUE2QyxFQUFFO1lBQ2hELE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3RELElBQUksK0JBQWM7WUFDaEIsVUFBVSxDQUFDLFNBQVM7WUFDcEIsYUFBYSxDQUFDLFNBQVMsRUFDdkIsQ0FBQyxFQUFFLEVBQUUsRUFBRSw4QkFBOEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQ3pELENBQ0YsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDJEQUEyRCxFQUFFO1lBQzlELE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQzFELElBQUksK0JBQWMsQ0FDaEI7Z0JBQ0UsRUFBRSxFQUFFLENBQUM7Z0JBQ0wsSUFBSSxFQUFFLEtBQUs7YUFDWixFQUNELENBQUMsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDdEMsY0FBYyxDQUFDLFNBQVMsQ0FDekIsQ0FDRixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=