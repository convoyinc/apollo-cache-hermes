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
    describe("nested alias leaf-value", function () {
        var aliasQuery, snapshot;
        beforeAll(function () {
            aliasQuery = helpers_1.query("{\n        user {\n          info {\n            FirstName: name\n          }\n        }\n      }");
            snapshot = write_1.write(context, empty, aliasQuery, {
                user: {
                    info: {
                        FirstName: 'Foo',
                    },
                },
            }).snapshot;
        });
        it("only writes fields from the schema", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                user: {
                    info: {
                        name: 'Foo',
                    },
                },
            });
        });
        it("checks shape of GraphNodeSnapshot", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId)).to.deep.eq(new nodes_1.EntitySnapshot({
                user: {
                    info: {
                        name: 'Foo',
                    },
                },
            }, 
            /* inbound */ undefined, 
            /* outbound */ undefined));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkQWxpYXNMZWFmVmFsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXN0ZWRBbGlhc0xlYWZWYWx1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsa0RBQTBEO0FBQzFELDZEQUE0RDtBQUM1RCxvREFBdUU7QUFDdkUsK0NBQTBEO0FBRWxELElBQUEsNkNBQXNCLENBQWtCO0FBRWhELGdGQUFnRjtBQUNoRixFQUFFO0FBQ0YsNkVBQTZFO0FBQzdFLGdGQUFnRjtBQUNoRixRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFFM0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyxJQUFNLEtBQUssR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztJQUVsQyxRQUFRLENBQUMseUJBQXlCLEVBQUU7UUFFbEMsSUFBSSxVQUF3QixFQUFFLFFBQXVCLENBQUM7UUFDdEQsU0FBUyxDQUFDO1lBQ1IsVUFBVSxHQUFHLGVBQUssQ0FBQyxtR0FNakIsQ0FBQyxDQUFDO1lBRUosUUFBUSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRTtnQkFDM0MsSUFBSSxFQUFFO29CQUNKLElBQUksRUFBRTt3QkFDSixTQUFTLEVBQUUsS0FBSztxQkFDakI7aUJBQ0Y7YUFDRixDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsb0NBQW9DLEVBQUU7WUFDdkMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsSUFBSSxFQUFFO29CQUNKLElBQUksRUFBRTt3QkFDSixJQUFJLEVBQUUsS0FBSztxQkFDWjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG1DQUFtQyxFQUFFO1lBQ3RDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3RELElBQUksc0JBQWMsQ0FDaEI7Z0JBQ0UsSUFBSSxFQUFFO29CQUNKLElBQUksRUFBRTt3QkFDSixJQUFJLEVBQUUsS0FBSztxQkFDWjtpQkFDRjthQUNGO1lBQ0QsYUFBYSxDQUFDLFNBQVM7WUFDdkIsY0FBYyxDQUFDLFNBQVMsQ0FDekIsQ0FDRixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=