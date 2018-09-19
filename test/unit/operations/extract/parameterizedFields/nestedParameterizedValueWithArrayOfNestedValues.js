"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("nested parameterized value with an array of nested values", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                one: {
                    two: [
                        {
                            three: {
                                threeValue: 'first',
                            },
                        },
                        {
                            three: {
                                threeValue: 'second',
                            },
                        },
                        null,
                    ],
                },
            }, "query nested($id: ID!) {\n          one {\n            two(id: $id) {\n              three {\n                threeValue\n              }\n            }\n          }\n        }", cacheContext, { id: 1 });
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
            var parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [{ id: parameterizedId, path: ['one', 'two'] }],
                },
                _a[parameterizedId] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two'] }],
                    data: [
                        {
                            three: {
                                threeValue: 'first',
                            },
                        },
                        {
                            three: {
                                threeValue: 'second',
                            },
                        },
                        null,
                    ],
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlV2l0aEFycmF5T2ZOZXN0ZWRWYWx1ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXN0ZWRQYXJhbWV0ZXJpemVkVmFsdWVXaXRoQXJyYXlPZk5lc3RlZFZhbHVlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlFQUFnRTtBQUNoRSwrRUFBMkY7QUFDM0Ysb0RBQXVFO0FBQ3ZFLCtDQUFvRjtBQUU1RSxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLDJEQUEyRCxFQUFFO1FBRXBFLElBQUksYUFBeUMsQ0FBQztRQUM5QyxTQUFTLENBQUM7WUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1lBQ2hELElBQU0sUUFBUSxHQUFHLDZCQUFtQixDQUNsQztnQkFDRSxHQUFHLEVBQUU7b0JBQ0gsR0FBRyxFQUFFO3dCQUNIOzRCQUNFLEtBQUssRUFBRTtnQ0FDTCxVQUFVLEVBQUUsT0FBTzs2QkFDcEI7eUJBQ0Y7d0JBQ0Q7NEJBQ0UsS0FBSyxFQUFFO2dDQUNMLFVBQVUsRUFBRSxRQUFROzZCQUNyQjt5QkFDRjt3QkFDRCxJQUFJO3FCQUNMO2lCQUNGO2FBQ0YsRUFDRCxrTEFRRSxFQUNGLFlBQVksRUFDWixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FDVixDQUFDO1lBRUYsYUFBYSxHQUFHLGlCQUFPLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFO1lBQ3ZDLElBQU0sZUFBZSxHQUFHLDRDQUEyQixDQUNqRCxXQUFXLEVBQ1gsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQ2QsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQ1YsQ0FBQztZQUVGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQzlCLEdBQUMsV0FBVyxJQUFHO29CQUNiLElBQUksd0JBQThDO29CQUNsRCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7aUJBQzFEO2dCQUNELEdBQUMsZUFBZSxJQUFHO29CQUNqQixJQUFJLG9DQUEwRDtvQkFDOUQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNwRCxJQUFJLEVBQUU7d0JBQ0o7NEJBQ0UsS0FBSyxFQUFFO2dDQUNMLFVBQVUsRUFBRSxPQUFPOzZCQUNwQjt5QkFDRjt3QkFDRDs0QkFDRSxLQUFLLEVBQUU7Z0NBQ0wsVUFBVSxFQUFFLFFBQVE7NkJBQ3JCO3lCQUNGO3dCQUNELElBQUk7cUJBQ0w7aUJBQ0Y7b0JBQ0QsQ0FBQzs7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==