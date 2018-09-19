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
                two: {
                    three: { id: 0 },
                    four: { id: 1 },
                },
            },
        }, "{ \n          one {\n            two {\n              three { id }\n              four { id }\n            }\n          }\n      }", cacheContext);
        var pruneQuery = helpers_1.query("{ \n      one {\n        two {\n          four { id }\n        }\n      }\n    }");
        var pruned = operations_1.prune(cacheContext, snapshot, pruneQuery);
        extractResult = operations_1.extract(pruned.snapshot, cacheContext);
    });
    it("prunes fields from entities in cache with nested references and peer reference correctly", function () {
        expect(extractResult).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                outbound: [
                    { id: '1', path: ['one', 'two', 'four'] },
                ],
                data: {
                    one: {
                        two: {
                            four: undefined,
                        },
                    },
                },
            },
            _a['1'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: QueryRootId, path: ['one', 'two', 'four'] }],
                data: { id: 1 },
            },
            _a));
        var _a;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUmVmZXJlbmNlV2l0aFBlZXJSZWZlcmVuY2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkUmVmZXJlbmNlV2l0aFBlZXJSZWZlcmVuY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseURBQTREO0FBQzVELGlEQUFvRTtBQUNwRSw0Q0FBd0Y7QUFFaEYsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBQzNCLElBQUksYUFBeUMsQ0FBQztJQUM5QyxTQUFTLENBQUM7UUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1FBQ2hELElBQU0sUUFBUSxHQUFHLDZCQUFtQixDQUNsQztZQUNFLEdBQUcsRUFBRTtnQkFDSCxHQUFHLEVBQUU7b0JBQ0gsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtvQkFDaEIsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtpQkFDaEI7YUFDRjtTQUNGLEVBQ0Qsb0lBT0UsRUFDRixZQUFZLENBQ2IsQ0FBQztRQUVGLElBQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyxrRkFNdkIsQ0FBQyxDQUFDO1FBQ0osSUFBTSxNQUFNLEdBQUcsa0JBQUssQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3pELGFBQWEsR0FBRyxvQkFBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDekQsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsMEZBQTBGLEVBQUU7UUFDN0YsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM5QixHQUFDLFdBQVcsSUFBRztnQkFDYixJQUFJLHdCQUE4QztnQkFDbEQsUUFBUSxFQUFFO29CQUNSLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxFQUFFO2lCQUMxQztnQkFDRCxJQUFJLEVBQUU7b0JBQ0osR0FBRyxFQUFFO3dCQUNILEdBQUcsRUFBRTs0QkFDSCxJQUFJLEVBQUUsU0FBUzt5QkFDaEI7cUJBQ0Y7aUJBQ0Y7YUFDRjtZQUNELE9BQUcsR0FBRTtnQkFDSCxJQUFJLHdCQUE4QztnQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDNUQsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTthQUNoQjtnQkFDRCxDQUFDOztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==