"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.restore", function () {
    describe("nested parameterized value with an array of nested values", function () {
        var parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            originalGraphSnapshot = helpers_1.createGraphSnapshot({
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
            restoreGraphSnapshot = operations_1.restore((_a = {},
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
                _a), cacheContext).cacheSnapshot.baseline;
            var _a;
        });
        it("restores GraphSnapshot from JSON serializable object", function () {
            expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
        });
        it("correctly restores different types of NodeSnapshot", function () {
            expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceof(nodes_1.ParameterizedValueSnapshot);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlV2l0aEFycmF5T2ZOZXN0ZWRWYWx1ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXN0ZWRQYXJhbWV0ZXJpemVkVmFsdWVXaXRoQXJyYXlPZk5lc3RlZFZhbHVlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLGtEQUFzRjtBQUN0Riw0REFBd0Q7QUFDeEQsK0VBQTJGO0FBQzNGLG9EQUF1RTtBQUN2RSwrQ0FBb0Y7QUFFNUUsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQywyREFBMkQsRUFBRTtRQUVwRSxJQUFNLGVBQWUsR0FBRyw0Q0FBMkIsQ0FDakQsV0FBVyxFQUNYLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUNkLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUNWLENBQUM7UUFFRixJQUFJLG9CQUFtQyxFQUFFLHFCQUFvQyxDQUFDO1FBQzlFLFNBQVMsQ0FBQztZQUNSLElBQU0sWUFBWSxHQUFHLGtDQUF3QixFQUFFLENBQUM7WUFDaEQscUJBQXFCLEdBQUcsNkJBQW1CLENBQ3pDO2dCQUNFLEdBQUcsRUFBRTtvQkFDSCxHQUFHLEVBQUU7d0JBQ0g7NEJBQ0UsS0FBSyxFQUFFO2dDQUNMLFVBQVUsRUFBRSxPQUFPOzZCQUNwQjt5QkFDRjt3QkFDRDs0QkFDRSxLQUFLLEVBQUU7Z0NBQ0wsVUFBVSxFQUFFLFFBQVE7NkJBQ3JCO3lCQUNGO3dCQUNELElBQUk7cUJBQ0w7aUJBQ0Y7YUFDRixFQUNELGtMQVFFLEVBQ0YsWUFBWSxFQUNaLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUNWLENBQUM7WUFFRixvQkFBb0IsR0FBRyxvQkFBTztnQkFDNUIsR0FBQyxXQUFXLElBQUc7b0JBQ2IsSUFBSSx3QkFBOEM7b0JBQ2xELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztpQkFDMUQ7Z0JBQ0QsR0FBQyxlQUFlLElBQUc7b0JBQ2pCLElBQUksb0NBQTBEO29CQUM5RCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3BELElBQUksRUFBRTt3QkFDSjs0QkFDRSxLQUFLLEVBQUU7Z0NBQ0wsVUFBVSxFQUFFLE9BQU87NkJBQ3BCO3lCQUNGO3dCQUNEOzRCQUNFLEtBQUssRUFBRTtnQ0FDTCxVQUFVLEVBQUUsUUFBUTs2QkFDckI7eUJBQ0Y7d0JBQ0QsSUFBSTtxQkFDTDtpQkFDRjtxQkFDQSxZQUFZLENBQUMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDOztRQUMxQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxzREFBc0QsRUFBRTtZQUN6RCxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9EQUFvRCxFQUFFO1lBQ3ZELE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQWMsQ0FBQyxDQUFDO1lBQzlGLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsa0NBQTBCLENBQUMsQ0FBQztRQUNoSCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==