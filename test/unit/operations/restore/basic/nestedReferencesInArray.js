"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var CacheContext_1 = require("../../../../../src/context/CacheContext");
var EntitySnapshot_1 = require("../../../../../src/nodes/EntitySnapshot");
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
    describe("nested references in an array", function () {
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = new CacheContext_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { entityTransformer: entityTransformer }));
            originalGraphSnapshot = helpers_1.createSnapshot({
                one: {
                    two: [
                        { three: { __typename: 'Three', id: 0 } },
                        { three: { __typename: 'Three', id: 1 } },
                        null,
                    ],
                },
            }, "{\n            one {\n              two {\n                three { __typename id }\n              }\n            }\n        }", 
            /* gqlVariables */ undefined, 
            /* rootId */ undefined, cacheContext).snapshot;
            restoreGraphSnapshot = operations_1.restore((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [
                        { id: '0', path: ['one', 'two', 0, 'three'] },
                        { id: '1', path: ['one', 'two', 1, 'three'] },
                    ],
                    data: {
                        one: {
                            two: [{}, {}, null],
                        },
                    },
                },
                _a['0'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
                    data: { __typename: 'Three', id: 0 },
                },
                _a['1'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
                    data: { __typename: 'Three', id: 1 },
                },
                _a), cacheContext).cacheSnapshot.baseline;
            var _a;
        });
        it("restores GraphSnapshot from JSON serializable object", function () {
            expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
        });
        it("correctly restores different types of NodeSnapshot", function () {
            expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot_1.EntitySnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot('0')).to.be.an.instanceOf(EntitySnapshot_1.EntitySnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot('1')).to.be.an.instanceOf(EntitySnapshot_1.EntitySnapshot);
        });
        it("correctly restore NodeSnapshot, entity transformation on specific entity", function () {
            expect(restoreGraphSnapshot.getNodeData('0')).to.be.an.instanceOf(Three);
            expect(restoreGraphSnapshot.getNodeData('1')).to.be.an.instanceOf(Three);
        });
        it("correctly restore NodeSnapshot, no entity transformation on QueryRootId", function () {
            expect(restoreGraphSnapshot.getNodeData(QueryRootId)).to.not.be.an.instanceOf(Three);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUmVmZXJlbmNlc0luQXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXN0ZWRSZWZlcmVuY2VzSW5BcnJheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3RUFBdUU7QUFFdkUsMEVBQXlFO0FBQ3pFLDREQUF3RDtBQUV4RCxvREFBdUU7QUFDdkUsK0NBQW1FO0FBRTNELElBQUEsNkNBQXNCLENBQWtCO0FBRWhEO0lBQ0UsZUFDUyxFQUFVO1FBQVYsT0FBRSxHQUFGLEVBQUUsQ0FBUTtJQUNoQixDQUFDO0lBRUoscUJBQUssR0FBTDtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFRCx3QkFBUSxHQUFSO1FBQ0UsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFDSCxZQUFDO0FBQUQsQ0FBQyxBQVpELElBWUM7QUFFRCwyQkFBMkIsSUFBZ0I7SUFDekMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDbkMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQy9DLENBQUM7QUFDSCxDQUFDO0FBRUQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQywrQkFBK0IsRUFBRTtRQUV4QyxJQUFJLG9CQUFtQyxFQUFFLHFCQUFvQyxDQUFDO1FBQzlFLFNBQVMsQ0FBQztZQUNSLElBQU0sWUFBWSxHQUFHLElBQUksMkJBQVksc0JBQ2hDLHNCQUFZLElBQ2YsaUJBQWlCLG1CQUFBLElBQ2pCLENBQUM7WUFFSCxxQkFBcUIsR0FBRyx3QkFBYyxDQUNwQztnQkFDRSxHQUFHLEVBQUU7b0JBQ0gsR0FBRyxFQUFFO3dCQUNILEVBQUUsS0FBSyxFQUFFLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVB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