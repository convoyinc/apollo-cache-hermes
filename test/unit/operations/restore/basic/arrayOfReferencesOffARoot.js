"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var CacheContext_1 = require("../../../../../src/context/CacheContext");
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
var Viewer = /** @class */ (function () {
    function Viewer(name, id) {
        this.name = name;
        this.id = id;
    }
    Viewer.prototype.getName = function () {
        return this.name;
    };
    Viewer.prototype.getId = function () {
        return this.id;
    };
    return Viewer;
}());
function entityTransformer(node) {
    if (node['__typename'] === 'viewer') {
        Object.setPrototypeOf(node, Viewer.prototype);
    }
}
describe("operations.restore", function () {
    describe("new array of references hanging off of a root", function () {
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = new CacheContext_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { entityTransformer: entityTransformer }));
            originalGraphSnapshot = helpers_1.createGraphSnapshot({
                viewer: [
                    {
                        __typename: 'viewer',
                        id: 123,
                        name: 'Gouda',
                    },
                    {
                        __typename: 'viewer',
                        id: 456,
                        name: 'Brie',
                    },
                    null,
                ],
            }, "{ viewer { __typename id name } }", cacheContext);
            restoreGraphSnapshot = operations_1.restore((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [
                        { id: '123', path: ['viewer', 0] },
                        { id: '456', path: ['viewer', 1] },
                    ],
                    data: {
                        viewer: [null, null, null],
                    },
                },
                _a['123'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['viewer', 0] }],
                    data: { __typename: 'viewer', id: 123, name: 'Gouda' },
                },
                _a['456'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['viewer', 1] }],
                    data: { __typename: 'viewer', id: 456, name: 'Brie' },
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
            expect(restoreGraphSnapshot.getNodeSnapshot('456')).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
        it("correctly restores NodeSnapshot, entity transformation on specific entity", function () {
            expect(restoreGraphSnapshot.getNodeData('123')).to.be.an.instanceOf(Viewer);
            expect(restoreGraphSnapshot.getNodeData('456')).to.be.an.instanceOf(Viewer);
        });
        it("correctly restores NodeSnapshot, no entity transformation on QueryRootId", function () {
            expect(restoreGraphSnapshot.getNodeData(QueryRootId)).to.not.be.an.instanceOf(Viewer);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlPZlJlZmVyZW5jZXNPZmZBUm9vdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFycmF5T2ZSZWZlcmVuY2VzT2ZmQVJvb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsd0VBQXVFO0FBRXZFLGtEQUEwRDtBQUMxRCw0REFBd0Q7QUFFeEQsb0RBQXVFO0FBQ3ZFLCtDQUF3RTtBQUVoRSxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRDtJQUNFLGdCQUNTLElBQVksRUFDWixFQUFVO1FBRFYsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLE9BQUUsR0FBRixFQUFFLENBQVE7SUFDaEIsQ0FBQztJQUVKLHdCQUFPLEdBQVA7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztJQUNuQixDQUFDO0lBRUQsc0JBQUssR0FBTDtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFDSCxhQUFDO0FBQUQsQ0FBQyxBQWJELElBYUM7QUFFRCwyQkFBMkIsSUFBZ0I7SUFDekMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDcEMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELENBQUM7QUFDSCxDQUFDO0FBRUQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQywrQ0FBK0MsRUFBRTtRQUV4RCxJQUFJLG9CQUFtQyxFQUFFLHFCQUFvQyxDQUFDO1FBQzlFLFNBQVMsQ0FBQztZQUNSLElBQU0sWUFBWSxHQUFHLElBQUksMkJBQVksc0JBQ2hDLHNCQUFZLElBQ2YsaUJBQWlCLG1CQUFBLElBQ2pCLENBQUM7WUFFSCxxQkFBcUIsR0FBRyw2QkFBbUIsQ0FDekM7Z0JBQ0UsTUFBTSxFQUFFO29CQUNOO3dCQUNFLFVBQVUsRUFBRSxRQUFRO3dCQUNwQixFQUFF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