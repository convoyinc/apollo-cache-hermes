"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operations_1 = require("../../../../src/operations");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.prune", function () {
    var cacheContext;
    var snapshot;
    var extractResult;
    beforeAll(function () {
        cacheContext = helpers_1.createStrictCacheContext();
        snapshot = helpers_1.createGraphSnapshot({
            foo: {
                id: 1,
                name: 'Foo',
                bar: {
                    id: 2,
                    name: 'Bar',
                    fizz: { id: 1 },
                    buzz: { id: 2 },
                },
            },
        }, "{\n        foo {\n          id\n          name\n          bar {\n            id\n            name\n            fizz { id }\n            buzz { id }\n          }\n        }\n      }", cacheContext);
    });
    it("prunes value from cyclic graph correctly", function () {
        // prune field `name` out of `bar`
        var pruneQuery = helpers_1.query("{\n      foo {\n        id\n        name\n        bar {\n          id\n          fizz { id }\n          buzz { id }\n        }\n      }\n    }");
        var pruned = operations_1.prune(cacheContext, snapshot, pruneQuery);
        extractResult = operations_1.extract(pruned.snapshot, cacheContext);
        expect(extractResult).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                outbound: [{ id: '1', path: ['foo'] }],
                data: {
                    foo: undefined,
                },
            },
            _a['1'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [
                    { id: QueryRootId, path: ['foo'] },
                    { id: '2', path: ['fizz'] },
                ],
                outbound: [
                    { id: '2', path: ['bar'] },
                ],
                data: {
                    id: 1,
                    name: 'Foo',
                    bar: undefined,
                },
            },
            _a['2'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [
                    { id: '1', path: ['bar'] },
                    { id: '2', path: ['buzz'] },
                ],
                outbound: [
                    { id: '1', path: ['fizz'] },
                    { id: '2', path: ['buzz'] },
                ],
                data: {
                    id: 2,
                    fizz: undefined,
                    buzz: undefined,
                },
            },
            _a));
        var _a;
    });
    it("prunes reference from cyclic graph correctly", function () {
        // prune field 'fizz' out of `bar`
        var pruneQuery = helpers_1.query("{\n      foo {\n        id\n        name\n        bar {\n          id\n          name\n          buzz { id }\n        }\n      }\n    }");
        var pruned = operations_1.prune(cacheContext, snapshot, pruneQuery);
        extractResult = operations_1.extract(pruned.snapshot, cacheContext);
        expect(extractResult).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                outbound: [{ id: '1', path: ['foo'] }],
                data: {
                    foo: undefined,
                },
            },
            _a['1'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [
                    { id: QueryRootId, path: ['foo'] },
                ],
                outbound: [
                    { id: '2', path: ['bar'] },
                ],
                data: {
                    id: 1,
                    name: 'Foo',
                    bar: undefined,
                },
            },
            _a['2'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [
                    { id: '1', path: ['bar'] },
                    { id: '2', path: ['buzz'] },
                ],
                outbound: [
                    { id: '2', path: ['buzz'] },
                ],
                data: {
                    id: 2,
                    name: 'Bar',
                    buzz: undefined,
                },
            },
            _a));
        var _a;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3ljbGljUmVmZXJlbmNlc0dyYXBoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3ljbGljUmVmZXJlbmNlc0dyYXBoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEseURBQTREO0FBQzVELGlEQUFvRTtBQUNwRSw0Q0FBd0Y7QUFFaEYsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBQzNCLElBQUksWUFBMEIsQ0FBQztJQUMvQixJQUFJLFFBQXVCLENBQUM7SUFDNUIsSUFBSSxhQUF5QyxDQUFDO0lBQzlDLFNBQVMsQ0FBQztRQUNSLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1FBQzFDLFFBQVEsR0FBRyw2QkFBbUIsQ0FDNUI7WUFDRSxHQUFHLEVBQUU7Z0JBQ0gsRUFBRSxFQUFFLENBQUM7Z0JBQ0wsSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxDQUFDO29CQUNMLElBQUksRUFBRSxLQUFLO29CQUNYLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7b0JBQ2YsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtpQkFDaEI7YUFDRjtTQUNGLEVBQ0Qsc0xBV0UsRUFDRixZQUFZLENBQ2IsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDBDQUEwQyxFQUFFO1FBQzdDLGtDQUFrQztRQUNsQyxJQUFNLFVBQVUsR0FBRyxlQUFLLENBQUMsZ0pBVXZCLENBQUMsQ0FBQztRQUNKLElBQU0sTUFBTSxHQUFHLGtCQUFLLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN6RCxhQUFhLEdBQUcsb0JBQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFD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