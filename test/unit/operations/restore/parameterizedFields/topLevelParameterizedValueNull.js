"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.restore", function () {
    describe("top-level parameterized reference", function () {
        var parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            originalGraphSnapshot = helpers_1.createGraphSnapshot({
                foo: null,
            }, "query getAFoo($id: ID!) {\n          foo(id: $id, withExtra: true) {\n            id name extra\n          }\n        }", cacheContext, { id: 1 });
            restoreGraphSnapshot = operations_1.restore((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [{ id: parameterizedId, path: ['foo'] }],
                },
                _a[parameterizedId] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: QueryRootId, path: ['foo'] }],
                    data: null,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9wTGV2ZWxQYXJhbWV0ZXJpemVkVmFsdWVOdWxsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidG9wTGV2ZWxQYXJhbWV0ZXJpemVkVmFsdWVOdWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esa0RBQXNGO0FBQ3RGLDREQUF3RDtBQUN4RCwrRUFBMkY7QUFDM0Ysb0RBQXVFO0FBQ3ZFLCtDQUFvRjtBQUU1RSxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLG1DQUFtQyxFQUFFO1FBRTVDLElBQU0sZUFBZSxHQUFHLDRDQUEyQixDQUNqRCxXQUFXLEVBQ1gsQ0FBQyxLQUFLLENBQUMsRUFDUCxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUMzQixDQUFDO1FBQ0YsSUFBSSxvQkFBbUMsRUFBRSxxQkFBb0MsQ0FBQztRQUM5RSxTQUFTLENBQUM7WUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1lBQ2hELHFCQUFxQixHQUFHLDZCQUFtQixDQUN6QztnQkFDRSxHQUFHLEVBQUUsSUFBSTthQUNWLEVBQ0QseUhBSUUsRUFDRixZQUFZLEVBQ1osRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQ1YsQ0FBQztZQUVGLG9CQUFvQixHQUFHLG9CQUFPO2dCQUM1QixHQUFDLFdBQVcsSUFBRztvQkFDYixJQUFJLHdCQUE4QztvQkFDbEQsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7aUJBQ25EO2dCQUNELEdBQUMsZUFBZSxJQUFHO29CQUNqQixJQUFJLG9DQUEwRDtvQkFDOUQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQzdDLElBQUksRUFBRSxJQUFJO2lCQUNYO3FCQUNBLFlBQVksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7O1FBQzFDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHNEQUFzRCxFQUFFO1lBQ3pELE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDakUsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsb0RBQW9ELEVBQUU7WUFDdkQsTUFBTSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxzQkFBYyxDQUFDLENBQUM7WUFDOUYsTUFBTSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxrQ0FBMEIsQ0FBQyxDQUFDO1FBQ2hILENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9