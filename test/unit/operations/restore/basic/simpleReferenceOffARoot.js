"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.restore", function () {
    describe("simple references hanging off a root", function () {
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            originalGraphSnapshot = helpers_1.createGraphSnapshot({
                viewer: {
                    id: 123,
                    name: 'Gouda',
                },
                justValue: '42',
            }, "{\n          viewer {\n            id\n            name\n          }\n          justValue\n        }", cacheContext);
            restoreGraphSnapshot = operations_1.restore((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [{ id: '123', path: ['viewer'] }],
                    data: {
                        justValue: '42',
                    },
                },
                _a['123'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['viewer'] }],
                    data: { id: 123, name: 'Gouda' },
                },
                _a), cacheContext).cacheSnapshot.baseline;
            var _a;
        });
        it("restores GraphSnapshot from JSON serializable object", function () {
            expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
        });
        it("correctly restores different types of NodeSnapshot", function () {
            expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot('123')).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlUmVmZXJlbmNlT2ZmQVJvb3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzaW1wbGVSZWZlcmVuY2VPZmZBUm9vdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLGtEQUEwRDtBQUMxRCw0REFBd0Q7QUFDeEQsb0RBQXVFO0FBQ3ZFLCtDQUFvRjtBQUU1RSxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLHNDQUFzQyxFQUFFO1FBRS9DLElBQUksb0JBQW1DLEVBQUUscUJBQW9DLENBQUM7UUFDOUUsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztZQUNoRCxxQkFBcUIsR0FBRyw2QkFBbUIsQ0FDekM7Z0JBQ0UsTUFBTSxFQUFFO29CQUNOLEVBQUUsRUFBRSxHQUFHO29CQUNQLElBQUksRUFBRSxPQUFPO2lCQUNkO2dCQUNELFNBQVMsRUFBRSxJQUFJO2FBQ2hCLEVBQ0Qsc0dBTUUsRUFDRixZQUFZLENBQ2IsQ0FBQztZQUVGLG9CQUFvQixHQUFHLG9CQUFPO2dCQUM1QixHQUFDLFdBQVcsSUFBRztvQkFDYixJQUFJLHdCQUE4QztvQkFDbEQsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQzNDLElBQUksRUFBRTt3QkFDSixTQUFTLEVBQUUsSUFBSTtxQkFDaEI7aUJBQ0Y7Z0JBQ0QsU0FBSyxHQUFFO29CQUNMLElBQUksd0JBQThDO29CQUNsRCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDaEQsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO2lCQUNqQztxQkFDQSxZQUFZLENBQUMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDOztRQUMxQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxzREFBc0QsRUFBRTtZQUN6RCxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9EQUFvRCxFQUFFO1lBQ3ZELE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQWMsQ0FBQyxDQUFDO1lBQzlGLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQWMsQ0FBQyxDQUFDO1FBQzFGLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9