"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("nested parameterized value", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                one: {
                    two: [
                        {
                            three: {
                                name: 'Three0',
                                extra: false,
                            },
                        },
                        {
                            three: {
                                name: 'Three1',
                                extra: true,
                            },
                        },
                        null,
                    ],
                },
            }, "query getAFoo($id: ID!) {\n          one {\n            two {\n              three (id: $id, withExtra: true) {\n                name extra\n              }\n            }\n          }\n        }", cacheContext, { id: 1 });
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
            var parameterizedId0 = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two', 0, 'three'], { id: 1, withExtra: true });
            var parameterizedId1 = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two', 1, 'three'], { id: 1, withExtra: true });
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [
                        { id: parameterizedId0, path: ['one', 'two', 0, 'three'] },
                        { id: parameterizedId1, path: ['one', 'two', 1, 'three'] },
                    ],
                    data: {
                        one: {
                            two: [undefined, undefined, null],
                        },
                    },
                },
                _a[parameterizedId0] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
                    data: {
                        name: 'Three0',
                        extra: false,
                    },
                },
                _a[parameterizedId1] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
                    data: {
                        name: 'Three1',
                        extra: true,
                    },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlSW5BcnJheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5lc3RlZFBhcmFtZXRlcml6ZWRWYWx1ZUluQXJyYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpRUFBZ0U7QUFDaEUsK0VBQTJGO0FBQzNGLG9EQUF1RTtBQUN2RSwrQ0FBb0Y7QUFFNUUsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQyw0QkFBNEIsRUFBRTtRQUVyQyxJQUFJLGFBQXlDLENBQUM7UUFDOUMsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztZQUNoRCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7Z0JBQ0UsR0FBRyxFQUFFO29CQUNILEdBQUcsRUFBRTt3QkFDSDs0QkFDRSxLQUFLLEVBQUU7Z0NBQ0wsSUFBSSxFQUFFLFFBQVE7Z0NBQ2QsS0FBSyxFQUFFLEtBQUs7NkJBQ2I7eUJBQ0Y7d0JBQ0Q7NEJBQ0UsS0FBSyxFQUFFO2dDQUNMLElBQUksRUFBRSxRQUFRO2dDQUNkLEtBQUssRUFBRSxJQUFJOzZCQUNaO3lCQUNGO3dCQUNELElBQUk7cUJBQ0w7aUJBQ0Y7YUFDRixFQUNELHFNQVFFLEVBQ0YsWUFBWSxFQUNaLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUNWLENBQUM7WUFFRixhQUFhLEdBQUcsaUJBQU8sQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsb0NBQW9DLEVBQUU7WUFDdkMsSUFBTSxnQkFBZ0IsR0FBRyw0Q0FBMkIsQ0FDbEQsV0FBVyxFQUNYLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLEVBQzFCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQzNCLENBQUM7WUFDRixJQUFNLGdCQUFnQixHQUFHLDRDQUEyQixDQUNsRCxXQUFXLEVBQ1gsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsRUFDMUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FDM0IsQ0FBQztZQUVGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQzlCLEdBQUMsV0FBVyxJQUFHO29CQUNiLElBQUksd0JBQThDO29CQUNsRCxRQUFRLEVBQUU7d0JBQ1IsRUFBRSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLEVBQUU7d0JBQzFELEVBQUUsRUFBRSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxFQUFFO3FCQUMzRDtvQkFDRCxJQUFJLEVBQUU7d0JBQ0osR0FBRyxFQUFFOzRCQUNILEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDO3lCQUNsQztxQkFDRjtpQkFDRjtnQkFDRCxHQUFDLGdCQUFnQixJQUFHO29CQUNsQixJQUFJLG9DQUEwRDtvQkFDOUQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ2hFLElBQUksRUFBRTt3QkFDSixJQUFJLEVBQUUsUUFBUTt3QkFDZCxLQUFLLEVBQUUsS0FBSztxQkFDYjtpQkFDRjtnQkFDRCxHQUFDLGdCQUFnQixJQUFHO29CQUNsQixJQUFJLG9DQUEwRDtvQkFDOUQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ2hFLElBQUksRUFBRTt3QkFDSixJQUFJLEVBQUUsUUFBUTt3QkFDZCxLQUFLLEVBQUUsSUFBSTtxQkFDWjtpQkFDRjtvQkFDRCxDQUFDOztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9