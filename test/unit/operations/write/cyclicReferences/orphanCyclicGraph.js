"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe("operations.write", function () {
    describe("edit cyclic graph", function () {
        var snapshot, editedNodeIds;
        beforeAll(function () {
            var cyclicRefQuery = "{\n        foo {\n          id\n          name\n          bar {\n            id\n            name\n            fizz { id }\n            buzz { id }\n          }\n        }\n      }";
            var baseline = helpers_1.createSnapshot({
                foo: {
                    id: 1,
                    name: 'Foo',
                    bar: {
                        id: 2,
                        name: 'Bar',
                        fizz: { id: 1 },
                        buzz: { id: 2 },
                    },
                },
            }, cyclicRefQuery).snapshot;
            var result = helpers_1.updateSnapshot(baseline, { foo: null }, cyclicRefQuery);
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("removes the reference to the subgraph", function () {
            expect(snapshot.getNodeData(QueryRootId).foo).to.eq(null);
        });
        // TODO: Detect this case, and actually make it work.  Mark & sweep? :(
        it.skip("garbage collects the orphaned subgraph", function () {
            expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
        });
        it.skip("marks all nodes as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1', '2']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JwaGFuQ3ljbGljR3JhcGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvcnBoYW5DeWNsaWNHcmFwaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLG9EQUFpRTtBQUNqRSwrQ0FBcUU7QUFFN0QsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFDaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUMzQixRQUFRLENBQUMsbUJBQW1CLEVBQUU7UUFFNUIsSUFBSSxRQUF1QixFQUFFLGFBQTBCLENBQUM7UUFDeEQsU0FBUyxDQUFDO1lBQ1IsSUFBTSxjQUFjLEdBQUcsc0xBV3JCLENBQUM7WUFFSCxJQUFNLFFBQVEsR0FBRyx3QkFBYyxDQUM3QjtnQkFDRSxHQUFHLEVBQUU7b0JBQ0gsRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLEtBQUs7b0JBQ1gsR0FBRyxFQUFFO3dCQUNILEVBQUUsRUFBRSxDQUFDO3dCQUNMLElBQUksRUFBRSxLQUFLO3dCQUNYLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7d0JBQ2YsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtxQkFDaEI7aUJBQ0Y7YUFDRixFQUNELGNBQWMsQ0FDZixDQUFDLFFBQVEsQ0FBQztZQUVYLElBQU0sTUFBTSxHQUFHLHdCQUFjLENBQzNCLFFBQVEsRUFDUixFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFDYixjQUFjLENBQ2YsQ0FBQztZQUVGLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1lBQzNCLGFBQWEsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHVDQUF1QyxFQUFFO1lBQzFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7UUFFSCx1RUFBdUU7UUFDdkUsRUFBRSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsRUFBRTtZQUNoRCxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQy9ELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLElBQUksQ0FBQywyQkFBMkIsRUFBRTtZQUNuQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzdFLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9