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
            rows: [
                [
                    { value: 1, extra: 'wind' },
                    { value: 2, extra: 'air' },
                ],
                [
                    { value: 3, extra: 'fire' },
                    { value: 4, extra: 'earth' },
                ],
            ],
        }, "{ \n        rows {\n          value\n          extra\n        }\n      }", cacheContext);
        var pruneQuery = helpers_1.query("{ rows { value }}");
        var pruned = operations_1.prune(cacheContext, snapshot, pruneQuery);
        extractResult = operations_1.extract(pruned.snapshot, cacheContext);
    });
    it("is able to prune fields from entities in a 2d array correctly", function () {
        expect(extractResult).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                data: {
                    rows: [
                        [
                            { value: 1 },
                            { value: 2 },
                        ],
                        [
                            { value: 3 },
                            { value: 4 },
                        ],
                    ],
                },
            },
            _a));
        var _a;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlkaW1lbnNpb25hbFZhbHVlc0FycmF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXVsdGlkaW1lbnNpb25hbFZhbHVlc0FycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseURBQTREO0FBQzVELGlEQUFvRTtBQUNwRSw0Q0FBd0Y7QUFFaEYsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBQzNCLElBQUksYUFBeUMsQ0FBQztJQUM5QyxTQUFTLENBQUM7UUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1FBQ2hELElBQU0sUUFBUSxHQUFHLDZCQUFtQixDQUNsQztZQUNFLElBQUksRUFBRTtnQkFDSjtvQkFDRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRTtvQkFDM0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7aUJBQzNCO2dCQUNEO29CQUNFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFO29CQUMzQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtpQkFDN0I7YUFDRjtTQUNGLEVBQ0QsMEVBS0UsRUFDRixZQUFZLENBQ2IsQ0FBQztRQUVGLElBQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzlDLElBQU0sTUFBTSxHQUFHLGtCQUFLLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN6RCxhQUFhLEdBQUcsb0JBQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3pELENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLCtEQUErRCxFQUFFO1FBQ2xFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDOUIsR0FBQyxXQUFXLElBQUc7Z0JBQ2IsSUFBSSx3QkFBOEM7Z0JBQ2xELElBQUksRUFBRTtvQkFDSixJQUFJLEVBQUU7d0JBQ0o7NEJBQ0UsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFOzRCQUNaLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt5QkFDYjt3QkFDRDs0QkFDRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7NEJBQ1osRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3lCQUNiO3FCQUNGO2lCQUNGO2FBQ0Y7Z0JBQ0QsQ0FBQzs7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=