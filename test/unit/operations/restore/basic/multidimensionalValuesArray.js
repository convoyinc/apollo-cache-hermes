"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.restore", function () {
    describe("2d array of values hanging off of a root", function () {
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            originalGraphSnapshot = helpers_1.createGraphSnapshot({
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
            }, "{ \n          rows {\n            value\n          }\n        }", cacheContext);
            restoreGraphSnapshot = operations_1.restore((_a = {},
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
                _a), cacheContext).cacheSnapshot.baseline;
            var _a;
        });
        it("restores GraphSnapshot from JSON serializable object", function () {
            expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
        });
        it("correctly restores different types of NodeSnapshot", function () {
            expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlkaW1lbnNpb25hbFZhbHVlc0FycmF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXVsdGlkaW1lbnNpb25hbFZhbHVlc0FycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esa0RBQTBEO0FBQzFELDREQUF3RDtBQUN4RCxvREFBdUU7QUFDdkUsK0NBQW9GO0FBRTVFLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtJQUM3QixRQUFRLENBQUMsMENBQTBDLEVBQUU7UUFFbkQsSUFBSSxvQkFBbUMsRUFBRSxxQkFBb0MsQ0FBQztRQUM5RSxTQUFTLENBQUM7WUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1lBQ2hELHFCQUFxQixHQUFHLDZCQUFtQixDQUN6QztnQkFDRSxJQUFJLEVBQUU7b0JBQ0o7d0JBQ0UsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3dCQUNaLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtxQkFDYjtvQkFDRDt3QkFDRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQ1osRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3FCQUNiO2lCQUNGO2FBQ0YsRUFDRCxpRUFJRSxFQUNGLFlBQVksQ0FDYixDQUFDO1lBRUYsb0JBQW9CLEdBQUcsb0JBQU87Z0JBQzVCLEdBQUMsV0FBVyxJQUFHO29CQUNiLElBQUksd0JBQThDO29CQUNsRCxJQUFJLEVBQUU7d0JBQ0osSUFBSSxFQUFFOzRCQUNKO2dDQUNFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtnQ0FDWixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7NkJBQ2I7NEJBQ0Q7Z0NBQ0UsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO2dDQUNaLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTs2QkFDYjt5QkFDRjtxQkFDRjtpQkFDRjtxQkFDQSxZQUFZLENBQUMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDOztRQUMxQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxzREFBc0QsRUFBRTtZQUN6RCxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9EQUFvRCxFQUFFO1lBQ3ZELE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQWMsQ0FBQyxDQUFDO1FBQ2hHLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9