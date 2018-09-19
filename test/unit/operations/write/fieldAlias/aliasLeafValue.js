"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var nodes_1 = require("../../../../../src/nodes");
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
    describe("alias leaf-value", function () {
        var aliasQuery, snapshot;
        beforeAll(function () {
            aliasQuery = helpers_1.query("{\n        user {\n          id\n          FirstName: name\n        }\n      }");
            snapshot = write_1.write(context, empty, aliasQuery, {
                user: {
                    id: 0,
                    FirstName: 'Foo',
                },
            }).snapshot;
        });
        it("only writes fields from the schema", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                user: {
                    id: 0,
                    name: 'Foo',
                },
            });
        });
        it("checks shape of GraphNodeSnapshot", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId)).to.deep.eq(new nodes_1.EntitySnapshot({
                user: {
                    id: 0,
                    name: 'Foo',
                },
            }, 
            /* inbound */ undefined, 
            /* outbound */ [{ id: '0', path: ['user'] }]));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXNMZWFmVmFsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhbGlhc0xlYWZWYWx1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsa0RBQTBEO0FBQzFELDZEQUE0RDtBQUM1RCxvREFBdUU7QUFDdkUsK0NBQTBEO0FBRWxELElBQUEsNkNBQXNCLENBQWtCO0FBRWhELGdGQUFnRjtBQUNoRixFQUFFO0FBQ0YsNkVBQTZFO0FBQzdFLGdGQUFnRjtBQUNoRixRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFFM0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyxJQUFNLEtBQUssR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztJQUVsQyxRQUFRLENBQUMsa0JBQWtCLEVBQUU7UUFFM0IsSUFBSSxVQUF3QixFQUFFLFFBQXVCLENBQUM7UUFDdEQsU0FBUyxDQUFDO1lBQ1IsVUFBVSxHQUFHLGVBQUssQ0FBQyxnRkFLakIsQ0FBQyxDQUFDO1lBRUosUUFBUSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRTtnQkFDM0MsSUFBSSxFQUFFO29CQUNKLEVBQUUsRUFBRSxDQUFDO29CQUNMLFNBQVMsRUFBRSxLQUFLO2lCQUNqQjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtZQUN2QyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxJQUFJLEVBQUU7b0JBQ0osRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLEtBQUs7aUJBQ1o7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRTtZQUN0QyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUN0RCxJQUFJLHNCQUFjLENBQ2hCO2dCQUNFLElBQUksRUFBRTtvQkFDSixFQUFFLEVBQUUsQ0FBQztvQkFDTCxJQUFJLEVBQUUsS0FBSztpQkFDWjthQUNGO1lBQ0QsYUFBYSxDQUFDLFNBQVM7WUFDdkIsY0FBYyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FDN0MsQ0FDRixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=