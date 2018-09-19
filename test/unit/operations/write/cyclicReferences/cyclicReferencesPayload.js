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
    describe("cyclic references payload", function () {
        var snapshot, editedNodeIds;
        beforeAll(function () {
            var cyclicRefQuery = "{\n        foo {\n          id\n          name\n          bar {\n            id\n            name\n            fizz { id }\n            buzz { id }\n          }\n        }\n      }";
            var result = helpers_1.createSnapshot({
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
            }, cyclicRefQuery);
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("constructs a normalized cyclic graph", function () {
            var foo = snapshot.getNodeData('1');
            var bar = snapshot.getNodeData('2');
            expect(foo.id).to.eq(1);
            expect(foo.name).to.eq('Foo');
            expect(foo.bar).to.eq(bar);
            expect(bar.id).to.eq(2);
            expect(bar.name).to.eq('Bar');
            expect(bar.fizz).to.eq(foo);
            expect(bar.buzz).to.eq(bar);
        });
        it("properly references the cyclic nodes via QueryRoot", function () {
            expect(snapshot.getNodeData(QueryRootId).foo).to.eq(snapshot.getNodeData('1'));
        });
        it("marks all the nodes as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1', '2']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3ljbGljUmVmZXJlbmNlc1BheWxvYWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjeWNsaWNSZWZlcmVuY2VzUGF5bG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLG9EQUFpRTtBQUNqRSwrQ0FBcUQ7QUFFN0MsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUMzQixRQUFRLENBQUMsMkJBQTJCLEVBQUU7UUFFcEMsSUFBSSxRQUF1QixFQUFFLGFBQTBCLENBQUM7UUFDeEQsU0FBUyxDQUFDO1lBQ1IsSUFBTSxjQUFjLEdBQUcsc0xBV3JCLENBQUM7WUFFSCxJQUFNLE1BQU0sR0FBRyx3QkFBYyxDQUMzQjtnQkFDRSxHQUFHLEVBQUU7b0JBQ0gsRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLEtBQUs7b0JBQ1gsR0FBRyxFQUFFO3dCQUNILEVBQUUsRUFBRSxDQUFDO3dCQUNMLElBQUksRUFBRSxLQUFLO3dCQUNYLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7d0JBQ2YsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtxQkFDaEI7aUJBQ0Y7YUFDRixFQUNELGNBQWMsQ0FDZixDQUFDO1lBRUYsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDM0IsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsc0NBQXNDLEVBQUU7WUFDekMsSUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0QyxJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXRDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTNCLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvREFBb0QsRUFBRTtZQUN2RCxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNqRixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywrQkFBK0IsRUFBRTtZQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzdFLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9