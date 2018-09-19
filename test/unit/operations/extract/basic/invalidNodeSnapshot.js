"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var extract_1 = require("../../../../../src/operations/extract");
var helpers_1 = require("../../../../helpers");
describe("operations.extract", function () {
    describe("invalid NodeSnapshot type", function () {
        var snapshot;
        beforeAll(function () {
            var InvalidNodeSnapshot = /** @class */ (function () {
                function InvalidNodeSnapshot(data) {
                    this.data = data;
                }
                return InvalidNodeSnapshot;
            }());
            snapshot = new GraphSnapshot_1.GraphSnapshot({
                'a': new InvalidNodeSnapshot(null),
            });
        });
        it("throws error when extracting invalid NodeSnapshot type", function () {
            expect(function () {
                var cacheContext = helpers_1.createStrictCacheContext();
                extract_1.extract(snapshot, cacheContext);
            }).to.throw(/Serializable.NodeSnapshotType/i);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52YWxpZE5vZGVTbmFwc2hvdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludmFsaWROb2RlU25hcHNob3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxrRUFBaUU7QUFFakUsaUVBQWdFO0FBRWhFLCtDQUErRDtBQUUvRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLDJCQUEyQixFQUFFO1FBRXBDLElBQUksUUFBdUIsQ0FBQztRQUM1QixTQUFTLENBQUM7WUFDUjtnQkFDRSw2QkFBbUIsSUFBZTtvQkFBZixTQUFJLEdBQUosSUFBSSxDQUFXO2dCQUFHLENBQUM7Z0JBQ3hDLDBCQUFDO1lBQUQsQ0FBQyxBQUZELElBRUM7WUFFRCxRQUFRLEdBQUcsSUFBSSw2QkFBYSxDQUFDO2dCQUMzQixHQUFHLEVBQUUsSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7YUFDbkMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsd0RBQXdELEVBQUU7WUFDM0QsTUFBTSxDQUFDO2dCQUNMLElBQU0sWUFBWSxHQUFHLGtDQUF3QixFQUFFLENBQUM7Z0JBQ2hELGlCQUFPLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==