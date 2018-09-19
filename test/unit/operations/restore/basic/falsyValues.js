"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.restore", function () {
    describe("falsy values", function () {
        var restoreGraphSnapshot, cacheContext;
        beforeAll(function () {
            cacheContext = helpers_1.createStrictCacheContext();
            restoreGraphSnapshot = operations_1.restore((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    data: { null: null, false: false, zero: 0, string: '' },
                },
                _a), cacheContext).cacheSnapshot.baseline;
            var _a;
        });
        it("restores GraphSnapshot from JSON serializable object", function () {
            var originalGraphSnapshot = helpers_1.createGraphSnapshot({ null: null, false: false, zero: 0, string: '' }, "{ null, false, zero, string }", cacheContext);
            expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
        });
        it("correctly restores different types of NodeSnapshot", function () {
            expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFsc3lWYWx1ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmYWxzeVZhbHVlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLGtEQUEwRDtBQUMxRCw0REFBd0Q7QUFDeEQsb0RBQXVFO0FBQ3ZFLCtDQUFvRjtBQUU1RSxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLGNBQWMsRUFBRTtRQUV2QixJQUFJLG9CQUFtQyxFQUFFLFlBQTBCLENBQUM7UUFDcEUsU0FBUyxDQUFDO1lBQ1IsWUFBWSxHQUFHLGtDQUF3QixFQUFFLENBQUM7WUFDMUMsb0JBQW9CLEdBQUcsb0JBQU87Z0JBQzVCLEdBQUMsV0FBVyxJQUFHO29CQUNiLElBQUksd0JBQThDO29CQUNsRCxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFO2lCQUN4RDtxQkFDQSxZQUFZLENBQUMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDOztRQUMxQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxzREFBc0QsRUFBRTtZQUN6RCxJQUFNLHFCQUFxQixHQUFHLDZCQUFtQixDQUMvQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFDakQsK0JBQStCLEVBQy9CLFlBQVksQ0FDYixDQUFDO1lBQ0YsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNqRSxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvREFBb0QsRUFBRTtZQUN2RCxNQUFNLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLHNCQUFjLENBQUMsQ0FBQztRQUNoRyxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==