"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var CacheContext_1 = require("../../../../../src/context/CacheContext");
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
var Three = /** @class */ (function () {
    function Three(id) {
        this.id = id;
    }
    Three.prototype.getId = function () {
        return this.id;
    };
    Three.prototype.getValue = function () {
        return 3 + this.id;
    };
    return Three;
}());
function entityTransformer(node) {
    if (node['__typename'] === 'Three') {
        Object.setPrototypeOf(node, Three.prototype);
    }
}
describe("operations.restore", function () {
    describe("nested references", function () {
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = new CacheContext_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { entityTransformer: entityTransformer }));
            originalGraphSnapshot = helpers_1.createSnapshot({
                one: {
                    two: {
                        three: { __typename: 'Three', id: 0 },
                    },
                },
            }, "{\n            one {\n              two {\n                three { __typename id }\n              }\n            }\n        }", 
            /* gqlVariables */ undefined, 
            /* rootId */ undefined, cacheContext).snapshot;
            restoreGraphSnapshot = operations_1.restore((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [{ id: '0', path: ['one', 'two', 'three'] }],
                    data: {
                        one: {
                            two: {},
                        },
                    },
                },
                _a['0'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
                    data: { __typename: 'Three', id: 0 },
                },
                _a), cacheContext).cacheSnapshot.baseline;
            var _a;
        });
        it("restores GraphSnapshot from JSON serializable object", function () {
            expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
        });
        it("correctly restores different types of NodeSnapshot", function () {
            expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot('0')).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
        it("correctly restore NodeSnapshot, entity transformation on specific entity", function () {
            expect(restoreGraphSnapshot.getNodeData('0')).to.be.an.instanceOf(Three);
        });
        it("correctly restore NodeSnapshot, no entity transformation on QueryRootId", function () {
            expect(restoreGraphSnapshot.getNodeData(QueryRootId)).to.not.be.an.instanceOf(Three);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUmVmZXJlbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkUmVmZXJlbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHdFQUF1RTtBQUV2RSxrREFBMEQ7QUFDMUQsNERBQXdEO0FBRXhELG9EQUF1RTtBQUN2RSwrQ0FBbUU7QUFFM0QsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQ7SUFDRSxlQUNTLEVBQVU7UUFBVixPQUFFLEdBQUYsRUFBRSxDQUFRO0lBQ2hCLENBQUM7SUFFSixxQkFBSyxHQUFMO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVELHdCQUFRLEdBQVI7UUFDRSxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUNILFlBQUM7QUFBRCxDQUFDLEFBWkQsSUFZQztBQUVELDJCQUEyQixJQUFnQjtJQUN6QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNuQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDL0MsQ0FBQztBQUNILENBQUM7QUFFRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLG1CQUFtQixFQUFFO1FBRTVCLElBQUksb0JBQW1DLEVBQUUscUJBQW9DLENBQUM7UUFDOUUsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsSUFBSSwyQkFBWSxzQkFDaEMsc0JBQVksSUFDZixpQkFBaUIsbUJBQUEsSUFDakIsQ0FBQztZQUVILHFCQUFxQixHQUFHLHdCQUFjLENBQ3BDO2dCQUNFLEdBQUcsRUFBRTtvQkFDSCxHQUFHLEVBQUU7d0JBQ0gsS0FBSyxFQUFFLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO3FCQUN0QztpQkFDRjthQUNGLEVBQ0QsK0hBTUU7WUFDRixrQkFBa0IsQ0FBQyxTQUFTO1lBQzVCLFlBQVksQ0FBQyxTQUFTLEVBQ3RCLFlBQVksQ0FDYixDQUFDLFFBQVEsQ0FBQztZQUVYLG9CQUFvQixHQUFHLG9CQUFPO2dCQUM1QixHQUFDLFdBQVcsSUFBRztvQkFDYixJQUFJLHdCQUE4QztvQkFDbEQsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDdEQsSUFBSSxFQUFFO3dCQUNKLEdBQUcsRUFBRTs0QkFDSCxHQUFHLEVBQUUsRUFBRTt5QkFDUjtxQkFDRjtpQkFDRjtnQkFDRCxPQUFHLEdBQUU7b0JBQ0gsSUFBSSx3QkFBOEM7b0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQzdELElBQUksRUFBRSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtpQkFDckM7cUJBQ0EsWUFBWSxDQUFDLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQzs7UUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsc0RBQXNELEVBQUU7WUFDekQsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNqRSxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvREFBb0QsRUFBRTtZQUN2RCxNQUFNLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLHNCQUFjLENBQUMsQ0FBQztZQUM5RixNQUFNLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLHNCQUFjLENBQUMsQ0FBQztRQUN4RixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywwRUFBMEUsRUFBRTtZQUM3RSxNQUFNLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHlFQUF5RSxFQUFFO1lBQzVFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZGLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9