"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var CacheContext_1 = require("../../../../../src/context/CacheContext");
var EntitySnapshot_1 = require("../../../../../src/nodes/EntitySnapshot");
var operations_1 = require("../../../../../src/operations");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
var Foo = /** @class */ (function () {
    function Foo(id, name, isFoo) {
        this.id = id;
        this.name = name;
        this.isFoo = isFoo;
    }
    Foo.prototype.getId = function () {
        return this.id;
    };
    Foo.prototype.getName = function () {
        return this.name;
    };
    Foo.prototype.isFooInstance = function () {
        return this.isFoo;
    };
    return Foo;
}());
var Bar = /** @class */ (function () {
    function Bar(id, name, isBar) {
        this.id = id;
        this.name = name;
        this.isBar = isBar;
    }
    Bar.prototype.getId = function () {
        return this.id;
    };
    Bar.prototype.getName = function () {
        return this.name;
    };
    Bar.prototype.isBarInstance = function () {
        return this.isBar;
    };
    return Bar;
}());
function entityTransformer(node) {
    switch (node['__typename']) {
        case 'Foo':
            Object.setPrototypeOf(node, Foo.prototype);
            break;
        case 'Bar':
            Object.setPrototypeOf(node, Bar.prototype);
            break;
    }
}
describe("operations.restore", function () {
    describe("multiple references hanging off a root", function () {
        var restoreGraphSnapshot, originaGraphSnapshot;
        beforeAll(function () {
            var cacheContext = new CacheContext_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { entityTransformer: entityTransformer }));
            originaGraphSnapshot = helpers_1.createSnapshot({
                bar: {
                    __typename: 'Bar',
                    id: 123,
                    name: 'Gouda',
                    isBar: true,
                },
                foo: {
                    __typename: 'Foo',
                    id: 456,
                    name: 'Brie',
                    isFoo: true,
                },
            }, "{\n          bar { __typename id name isBar }\n          foo { __typename id name isFoo }\n        }", 
            /* gqlVariables */ undefined, 
            /* rootId */ undefined, cacheContext).snapshot;
            restoreGraphSnapshot = operations_1.restore((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [
                        { id: '123', path: ['bar'] },
                        { id: '456', path: ['foo'] },
                    ],
                    data: {},
                },
                _a['123'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['bar'] }],
                    data: {
                        __typename: 'Bar',
                        id: 123,
                        name: 'Gouda',
                        isBar: true,
                    },
                },
                _a['456'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['foo'] }],
                    data: {
                        __typename: 'Foo',
                        id: 456,
                        name: 'Brie',
                        isFoo: true,
                    },
                },
                _a), cacheContext).cacheSnapshot.baseline;
            var _a;
        });
        it("restores GraphSnapshot from JSON serializable object", function () {
            expect(restoreGraphSnapshot).to.deep.eq(originaGraphSnapshot);
        });
        it("correctly restores different types of NodeSnapshot", function () {
            expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot_1.EntitySnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot('123')).to.be.an.instanceOf(EntitySnapshot_1.EntitySnapshot);
            expect(restoreGraphSnapshot.getNodeSnapshot('456')).to.be.an.instanceOf(EntitySnapshot_1.EntitySnapshot);
        });
        it("correctly restore NodeSnapshot, entity transformation on specific entity", function () {
            expect(restoreGraphSnapshot.getNodeData('123')).to.be.an.instanceOf(Bar);
            expect(restoreGraphSnapshot.getNodeData('456')).to.be.an.instanceOf(Foo);
        });
        it("correctly restore NodeSnapshot, no entity transformation on QueryRootId", function () {
            expect(restoreGraphSnapshot.getNodeData(QueryRootId)).to.not.be.an.instanceOf(Bar);
            expect(restoreGraphSnapshot.getNodeData(QueryRootId)).to.not.be.an.instanceOf(Foo);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlwbGVSZWZlcmVuY2VzT2ZmQVJvb3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtdWx0aXBsZVJlZmVyZW5jZXNPZmZBUm9vdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3RUFBdUU7QUFFdkUsMEVBQXlFO0FBQ3pFLDREQUF3RDtBQUV4RCxvREFBdUU7QUFDdkUsK0NBQW1FO0FBRTNELElBQUEsNkNBQXNCLENBQWtCO0FBRWhEO0lBQ0UsYUFDUyxFQUFVLEVBQ1YsSUFBWSxFQUNaLEtBQWM7UUFGZCxPQUFFLEdBQUYsRUFBRSxDQUFRO1FBQ1YsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLFVBQUssR0FBTCxLQUFLLENBQVM7SUFDcEIsQ0FBQztJQUVKLG1CQUFLLEdBQUw7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBRUQscUJBQU8sR0FBUDtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFRCwyQkFBYSxHQUFiO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUNILFVBQUM7QUFBRCxDQUFDLEFBbEJELElBa0JDO0FBRUQ7SUFDRSxhQUNTLEVBQVUsRUFDVixJQUFZLEVBQ1osS0FBYztRQUZkLE9BQUUsR0FBRixFQUFFLENBQVE7UUFDVixTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ1osVUFBSyxHQUFMLEtBQUssQ0FBUztJQUNwQixDQUFDO0lBRUosbUJBQUssR0FBTDtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFRCxxQkFBTyxHQUFQO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDbkIsQ0FBQztJQUVELDJCQUFhLEdBQWI7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0lBQ0gsVUFBQztBQUFELENB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