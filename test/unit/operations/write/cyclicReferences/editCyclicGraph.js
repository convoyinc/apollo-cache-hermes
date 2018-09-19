"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("../../../../helpers");
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
            var result = helpers_1.updateSnapshot(baseline, {
                foo: {
                    id: 1,
                    name: 'Foo',
                    bar: {
                        id: 2,
                        name: 'Barrington',
                        fizz: { id: 1 },
                        buzz: { id: 2 },
                    },
                },
            }, cyclicRefQuery);
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("fixes all references to the edited node", function () {
            var foo = snapshot.getNodeData('1');
            var bar = snapshot.getNodeData('2');
            expect(foo.id).to.eq(1);
            expect(foo.name).to.eq('Foo');
            expect(foo.bar).to.eq(bar);
            expect(bar.id).to.eq(2);
            expect(bar.name).to.eq('Barrington');
            expect(bar.fizz).to.eq(foo);
            expect(bar.buzz).to.eq(bar);
        });
        it("only marks the edited node", function () {
            expect(Array.from(editedNodeIds)).to.have.members(['2']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdEN5Y2xpY0dyYXBoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWRpdEN5Y2xpY0dyYXBoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsK0NBQXFFO0FBRXJFLGdGQUFnRjtBQUNoRixFQUFFO0FBQ0YsNkVBQTZFO0FBQzdFLGdGQUFnRjtBQUNoRixRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFDM0IsUUFBUSxDQUFDLG1CQUFtQixFQUFFO1FBRTVCLElBQUksUUFBdUIsRUFBRSxhQUEwQixDQUFDO1FBQ3hELFNBQVMsQ0FBQztZQUNSLElBQU0sY0FBYyxHQUFHLHNMQVdyQixDQUFDO1lBRUgsSUFBTSxRQUFRLEdBQUcsd0JBQWMsQ0FDN0I7Z0JBQ0UsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxDQUFDO29CQUNMLElBQUksRUFBRSxLQUFLO29CQUNYLEdBQUcsRUFBRTt3QkFDSCxFQUFFLEVBQUUsQ0FBQzt3QkFDTCxJQUFJLEVBQUUsS0FBSzt3QkFDWCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO3dCQUNmLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7cUJBQ2hCO2lCQUNGO2FBQ0YsRUFDRCxjQUFjLENBQ2YsQ0FBQyxRQUFRLENBQUM7WUFFWCxJQUFNLE1BQU0sR0FBRyx3QkFBYyxDQUMzQixRQUFRLEVBQ1I7Z0JBQ0UsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxDQUFDO29CQUNMLElBQUksRUFBRSxLQUFLO29CQUNYLEdBQUcsRUFBRTt3QkFDSCxFQUFFLEVBQUUsQ0FBQzt3QkFDTCxJQUFJLEVBQUUsWUFBWTt3QkFDbEIsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTt3QkFDZixJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO3FCQUNoQjtpQkFDRjthQUNGLEVBQ0QsY0FBYyxDQUNmLENBQUM7WUFDRixRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUMzQixhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRTtZQUM1QyxJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLElBQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFM0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDRCQUE0QixFQUFFO1lBQy9CLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzNELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9