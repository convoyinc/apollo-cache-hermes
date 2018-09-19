"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("../../../../helpers");
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe("operations.write", function () {
    describe("invalid nested values, scalar in place of object value", function () {
        it("creates the query root, with the values", function () {
            expect(function () {
                helpers_1.createSnapshot({
                    foo: {
                        bar: 'THIS IS A STRING NOT OBJECT',
                    },
                }, "{\n            foo {\n              bar {\n                value\n                prop1\n                prop2\n              }\n            }\n          }");
            }).to.throw(/foo\.bar/);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52YWxpZE5lc3RlZFZhbHVlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludmFsaWROZXN0ZWRWYWx1ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQ0FBcUQ7QUFFckQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUMzQixRQUFRLENBQUMsd0RBQXdELEVBQUU7UUFFakUsRUFBRSxDQUFDLHlDQUF5QyxFQUFFO1lBQzVDLE1BQU0sQ0FBQztnQkFDTCx3QkFBYyxDQUNaO29CQUNFLEdBQUcsRUFBRTt3QkFDSCxHQUFHLEVBQUUsNkJBQTZCO3FCQUNuQztpQkFDRixFQUNELDZKQVFFLENBQ0gsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=