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
            one: {
                two: [
                    { three: { id: 0, stuff: 'a' } },
                    { three: { id: 1, stuff: 'b' } },
                ],
            },
        }, "{ \n          one {\n            two {\n              three { id stuff }\n            }\n          }\n      }", cacheContext);
        var pruneQuery = helpers_1.query("{ \n      one {\n        two {\n          three { id }\n        }\n      }\n    }");
        var pruned = operations_1.prune(cacheContext, snapshot, pruneQuery);
        extractResult = operations_1.extract(pruned.snapshot, cacheContext);
    });
    it("prunes fields from the entities referenced by nested object in an array correctly", function () {
        expect(extractResult).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                outbound: [
                    { id: '0', path: ['one', 'two', 0, 'three'] },
                    { id: '1', path: ['one', 'two', 1, 'three'] },
                ],
                data: {
                    one: {
                        two: [{ three: undefined }, { three: undefined }],
                    },
                },
            },
            _a['0'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
                data: { id: 0 },
            },
            _a['1'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
                data: { id: 1 },
            },
            _a));
        var _a;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUmVmZXJlbmNlc0luQXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXN0ZWRSZWZlcmVuY2VzSW5BcnJheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlEQUE0RDtBQUM1RCxpREFBb0U7QUFDcEUsNENBQXdGO0FBRWhGLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUMzQixJQUFJLGFBQXlDLENBQUM7SUFDOUMsU0FBUyxDQUFDO1FBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztRQUNoRCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7WUFDRSxHQUFHLEVBQUU7Z0JBQ0gsR0FBRyxFQUFFO29CQUNILEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7b0JBQ2hDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7aUJBQ2pDO2FBQ0Y7U0FDRixFQUNELCtHQU1FLEVBQ0YsWUFBWSxDQUNiLENBQUM7UUFFRixJQUFNLFVBQVUsR0FBRyxlQUFLLENBQUMsbUZBTXZCLENBQUMsQ0FBQztRQUNKLElBQU0sTUFBTSxHQUFHLGtCQUFLLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN6RCxhQUFhLEdBQUcsb0JBQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3pELENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLG1GQUFtRixFQUFFO1FBQ3RGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDOUIsR0FBQyxXQUFXLElBQUc7Z0JBQ2IsSUFBSSx3QkFBOEM7Z0JBQ2xELFFBQVEsRUFBRTtvQkFDUixFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLEVBQUU7b0JBQzdDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBRTtpQkFDOUM7Z0JBQ0QsSUFBSSxFQUFFO29CQUNKLEdBQUcsRUFBRTt3QkFDSCxHQUFHLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQztxQkFDbEQ7aUJBQ0Y7YUFDRjtZQUNELE9BQUcsR0FBRTtnQkFDSCxJQUFJLHdCQUE4QztnQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ2hFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7YUFDaEI7WUFDRCxPQUFHLEdBQUU7Z0JBQ0gsSUFBSSx3QkFBOEM7Z0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNoRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2FBQ2hCO2dCQUNELENBQUM7O0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9