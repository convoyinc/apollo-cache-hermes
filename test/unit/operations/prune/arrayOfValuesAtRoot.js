"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operations_1 = require("../../../../src/operations");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.prune", function () {
    var extractResult;
    beforeAll(function () {
        var cacheContext = helpers_1.createStrictCacheContext();
        var snapshot = helpers_1.createGraphSnapshot({
            viewer: [
                {
                    postal: 123,
                    name: 'Gouda',
                },
                {
                    postal: 456,
                    name: 'Brie',
                },
            ],
        }, "{ viewer { postal name } }", cacheContext);
        var pruneQuery = helpers_1.query("{ viewer { name }}");
        var pruned = operations_1.prune(cacheContext, snapshot, pruneQuery);
        extractResult = operations_1.extract(pruned.snapshot, cacheContext);
    });
    it("prunes fields from entities in an array at the root correctly", function () {
        expect(extractResult).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                data: {
                    viewer: [
                        { name: 'Gouda' },
                        { name: 'Brie' },
                    ],
                },
            },
            _a));
        var _a;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlPZlZhbHVlc0F0Um9vdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFycmF5T2ZWYWx1ZXNBdFJvb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5REFBNEQ7QUFDNUQsaURBQW9FO0FBQ3BFLDRDQUF3RjtBQUVoRixJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFDM0IsSUFBSSxhQUF5QyxDQUFDO0lBQzlDLFNBQVMsQ0FBQztRQUNSLElBQU0sWUFBWSxHQUFHLGtDQUF3QixFQUFFLENBQUM7UUFDaEQsSUFBTSxRQUFRLEdBQUcsNkJBQW1CLENBQ2xDO1lBQ0UsTUFBTSxFQUFFO2dCQUNOO29CQUNFLE1BQU0sRUFBRSxHQUFHO29CQUNYLElBQUksRUFBRSxPQUFPO2lCQUNkO2dCQUNEO29CQUNFLE1BQU0sRUFBRSxHQUFHO29CQUNYLElBQUksRUFBRSxNQUFNO2lCQUNiO2FBQ0Y7U0FDRixFQUNELDRCQUE0QixFQUM1QixZQUFZLENBQ2IsQ0FBQztRQUVGLElBQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQy9DLElBQU0sTUFBTSxHQUFHLGtCQUFLLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN6RCxhQUFhLEdBQUcsb0JBQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3pELENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLCtEQUErRCxFQUFFO1FBQ2xFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDOUIsR0FBQyxXQUFXLElBQUc7Z0JBQ2IsSUFBSSx3QkFBOEM7Z0JBQ2xELElBQUksRUFBRTtvQkFDSixNQUFNLEVBQUU7d0JBQ04sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO3dCQUNqQixFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7cUJBQ2pCO2lCQUNGO2FBQ0Y7Z0JBQ0QsQ0FBQzs7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=