"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var write_1 = require("../../../../../src/operations/write");
var helpers_1 = require("../../../../helpers");
describe("operations.write", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    describe("freezes complex values referenced from the payload", function () {
        it("checks values references from the payload", function () {
            var simpleQuery = helpers_1.query("{ foo }");
            var payload = {
                foo: {
                    bar: [
                        { baz: 123 },
                        { baz: 321 },
                    ],
                },
            };
            write_1.write(context, empty, simpleQuery, payload);
            expect(function () {
                payload.foo.bar[0].baz = 111;
            }).to.throw(/property.*baz/);
            expect(function () {
                payload.foo.fizz = 'nope';
            }).to.throw(/property.*fizz/);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJlZXplc0NvbXBsZXhWYWx1ZXNSZWZlcmVuY2VkRnJvbVBheWxvYWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmcmVlemVzQ29tcGxleFZhbHVlc1JlZmVyZW5jZWRGcm9tUGF5bG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsNkRBQTREO0FBQzVELCtDQUEwRDtBQUUxRCxRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFFM0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyxJQUFNLEtBQUssR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztJQUVsQyxRQUFRLENBQUMsb0RBQW9ELEVBQUU7UUFFN0QsRUFBRSxDQUFDLDJDQUEyQyxFQUFFO1lBQzlDLElBQU0sV0FBVyxHQUFHLGVBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyQyxJQUFNLE9BQU8sR0FBRztnQkFDZCxHQUFHLEVBQUU7b0JBQ0gsR0FBRyxFQUFFO3dCQUNILEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTt3QkFDWixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7cUJBQ2I7aUJBQ0Y7YUFDRixDQUFDO1lBQ0YsYUFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRTVDLE1BQU0sQ0FBQztnQkFDTCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1lBQy9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFN0IsTUFBTSxDQUFDO2dCQUNKLE9BQU8sQ0FBQyxHQUFXLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztZQUNyQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=