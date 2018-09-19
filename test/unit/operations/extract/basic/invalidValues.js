"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var helpers_1 = require("../../../../helpers");
describe("operations.extract", function () {
    describe("invalid values", function () {
        var snapshot, cacheContext;
        beforeAll(function () {
            cacheContext = helpers_1.createStrictCacheContext();
            snapshot = helpers_1.createGraphSnapshot({ nan: NaN, func: (function () { }) }, "{\n          nan\n          func\n        }", cacheContext);
        });
        it("throws error when extracting invalid values", function () {
            expect(function () {
                extract_1.extract(snapshot, cacheContext);
            }).to.throw(/unserializable/i);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52YWxpZFZhbHVlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludmFsaWRWYWx1ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxpRUFBZ0U7QUFDaEUsK0NBQW9GO0FBRXBGLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtJQUM3QixRQUFRLENBQUMsZ0JBQWdCLEVBQUU7UUFFekIsSUFBSSxRQUF1QixFQUFFLFlBQTBCLENBQUM7UUFDeEQsU0FBUyxDQUFDO1lBQ1IsWUFBWSxHQUFHLGtDQUF3QixFQUFFLENBQUM7WUFDMUMsUUFBUSxHQUFHLDZCQUFtQixDQUM1QixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsY0FBTyxDQUFDLENBQVEsRUFBRSxFQUNyQyw2Q0FHRSxFQUNGLFlBQVksQ0FDYixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUU7WUFDaEQsTUFBTSxDQUFDO2dCQUNMLGlCQUFPLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==