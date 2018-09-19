"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("../../../../helpers");
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe("operations.write", function () {
    describe("remove inbound references on cyclic graph", function () {
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
                        name: 'Bar',
                        fizz: null,
                        buzz: null,
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
            expect(bar.name).to.eq('Bar');
            expect(bar.fizz).to.eq(null);
            expect(bar.buzz).to.eq(null);
        });
        it("only marks the edited node", function () {
            expect(Array.from(editedNodeIds)).to.have.members(['2']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3ZlSW5ib3VuZFJlZmVyZW5jZXNPbkN5bGljR3JhcGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZW1vdmVJbmJvdW5kUmVmZXJlbmNlc09uQ3lsaWNHcmFwaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLCtDQUFxRTtBQUVyRSxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBQzNCLFFBQVEsQ0FBQywyQ0FBMkMsRUFBRTtRQUVwRCxJQUFJLFFBQXVCLEVBQUUsYUFBMEIsQ0FBQztRQUN4RCxTQUFTLENBQUM7WUFDUixJQUFNLGNBQWMsR0FBRyxzTEFXckIsQ0FBQztZQUVILElBQU0sUUFBUSxHQUFHLHdCQUFjLENBQzdCO2dCQUNFLEdBQUcsRUFBRTtvQkFDSCxFQUFFLEVBQUUsQ0FBQztvQkFDTCxJQUFJLEVBQUUsS0FBSztvQkFDWCxHQUFHLEVBQUU7d0JBQ0gsRUFBRSxFQUFFLENBQUM7d0JBQ0wsSUFBSSxFQUFFLEtBQUs7d0JBQ1gsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTt3QkFDZixJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO3FCQUNoQjtpQkFDRjthQUNGLEVBQ0QsY0FBYyxDQUNmLENBQUMsUUFBUSxDQUFDO1lBRVgsSUFBTSxNQUFNLEdBQUcsd0JBQWMsQ0FDM0IsUUFBUSxFQUNSO2dCQUNFLEdBQUcsRUFBRTtvQkFDSCxFQUFFLEVBQUUsQ0FBQztvQkFDTCxJQUFJLEVBQUUsS0FBSztvQkFDWCxHQUFHLEVBQUU7d0JBQ0gsRUFBRSxFQUFFLENBQUM7d0JBQ0wsSUFBSSxFQUFFLEtBQUs7d0JBQ1gsSUFBSSxFQUFFLElBQUk7d0JBQ1YsSUFBSSxFQUFFLElBQUk7cUJBQ1g7aUJBQ0Y7YUFDRixFQUNELGNBQWMsQ0FDZixDQUFDO1lBRUYsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDM0IsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMseUNBQXlDLEVBQUU7WUFDNUMsSUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0QyxJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXRDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTNCLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw0QkFBNEIsRUFBRTtZQUMvQixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==