"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../src/context");
var GraphSnapshot_1 = require("../../../../src/GraphSnapshot");
var operations_1 = require("../../../../src/operations");
var helpers_1 = require("../../../helpers");
describe("operations.read", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    describe("cyclic payload", function () {
        var readResult;
        beforeAll(function () {
            var cyclicQuery = helpers_1.query("{\n        foo {\n          id\n          name\n          bar {\n            id\n            name\n            fizz { id }\n            buzz { id }\n            foo {\n              id\n              name\n            }\n          }\n        }\n      }");
            var foo = { id: 0, name: 'Foo', bar: null };
            var bar = { id: 1, name: 'Bar', fizz: null, buzz: null, foo: foo };
            foo.bar = bar;
            var snapshot = operations_1.write(context, empty, cyclicQuery, { foo: foo, baz: null }).snapshot;
            readResult = operations_1.read(context, cyclicQuery, snapshot);
        });
        it("verify that read result is complete", function () {
            expect(readResult.complete).to.eq(true);
        });
        it("verify that read result is correct", function () {
            // Note that we explicitly DO NOT construct graph cycles for
            // non-references!
            var foo = {
                id: 0,
                name: 'Foo',
            };
            var bar = {
                id: 1,
                name: 'Bar',
                fizz: null,
                buzz: null,
                foo: foo,
            };
            foo['bar'] = bar;
            expect(readResult.result).to.deep.eq({ foo: foo });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3ljbGljUGF5bG9hZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImN5Y2xpY1BheWxvYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtREFBdUQ7QUFDdkQsK0RBQThEO0FBQzlELHlEQUFzRTtBQUN0RSw0Q0FBdUQ7QUFFdkQsUUFBUSxDQUFDLGlCQUFpQixFQUFFO0lBRTFCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFFbEMsUUFBUSxDQUFDLGdCQUFnQixFQUFFO1FBQ3pCLElBQUksVUFBdUIsQ0FBQztRQUM1QixTQUFTLENBQUM7WUFDUixJQUFNLFdBQVcsR0FBRyxlQUFLLENBQUMsOFBBZXhCLENBQUMsQ0FBQztZQUVKLElBQU0sR0FBRyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFXLEVBQUUsQ0FBQztZQUNyRCxJQUFNLEdBQUcsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxLQUFBLEVBQUUsQ0FBQztZQUNoRSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUVOLElBQUEsNEZBQVEsQ0FBNEQ7WUFDNUUsVUFBVSxHQUFHLGlCQUFJLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxxQ0FBcUMsRUFBRTtZQUN4QyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsb0NBQW9DLEVBQUU7WUFDdkMsNERBQTREO1lBQzVELGtCQUFrQjtZQUNsQixJQUFNLEdBQUcsR0FBRztnQkFDVixFQUFFLEVBQUUsQ0FBQztnQkFDTCxJQUFJLEVBQUUsS0FBSzthQUNaLENBQUM7WUFDRixJQUFNLEdBQUcsR0FBRztnQkFDVixFQUFFLEVBQUUsQ0FBQztnQkFDTCxJQUFJLEVBQUUsS0FBSztnQkFDWCxJQUFJLEVBQUUsSUFBSTtnQkFDVixJQUFJLEVBQUUsSUFBSTtnQkFDVixHQUFHLEtBQUE7YUFDSixDQUFDO1lBQ0YsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUVqQixNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxLQUFBLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9