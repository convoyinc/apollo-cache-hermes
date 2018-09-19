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
            foo: [
                { id: 'a', name: 'nameA', bar: { id: 1, stuff: 'payload' } },
                { id: 'a', name: 'nameA', bar: { id: 1, stuff: 'payload' } },
                { id: 'b', name: 'nameB', bar: { id: 1, stuff: 'payload' } },
                { id: 'a', name: 'nameA', bar: { id: 1, stuff: 'payload' } },
                { id: 'b', name: 'nameB', bar: { id: 1, stuff: 'payload' } },
            ],
            baz: {
                id: 'a', bar: { id: 1, stuff: 'payload' },
            },
        }, "{\n        foo {\n          id\n          name\n          bar { id stuff }\n        }\n        baz {\n          id\n          bar { id }\n        }\n      }", cacheContext);
        var pruneQuery = helpers_1.query("{\n      foo {\n        id\n        bar { id }\n      }\n      baz {\n        id\n        bar { id }\n      }\n    }");
        var pruned = operations_1.prune(cacheContext, snapshot, pruneQuery);
        extractResult = operations_1.extract(pruned.snapshot, cacheContext);
    });
    it("prunes value from duplicated references correctly", function () {
        expect(extractResult).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                outbound: [
                    { id: 'a', path: ['foo', 0] },
                    { id: 'a', path: ['foo', 1] },
                    { id: 'b', path: ['foo', 2] },
                    { id: 'a', path: ['foo', 3] },
                    { id: 'b', path: ['foo', 4] },
                    { id: 'a', path: ['baz'] },
                ],
                data: {
                    foo: [undefined, undefined, undefined, undefined, undefined],
                    baz: undefined,
                },
            },
            _a['1'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [
                    { id: 'a', path: ['bar'] },
                    { id: 'b', path: ['bar'] },
                ],
                data: {
                    id: 1,
                },
            },
            _a['a'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [
                    { id: QueryRootId, path: ['foo', 0] },
                    { id: QueryRootId, path: ['foo', 1] },
                    { id: QueryRootId, path: ['foo', 3] },
                    { id: QueryRootId, path: ['baz'] },
                ],
                outbound: [{ id: '1', path: ['bar'] }],
                data: {
                    id: 'a',
                    bar: undefined,
                },
            },
            _a['b'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [
                    { id: QueryRootId, path: ['foo', 2] },
                    { id: QueryRootId, path: ['foo', 4] },
                ],
                outbound: [{ id: '1', path: ['bar'] }],
                data: {
                    id: 'b',
                    bar: undefined,
                },
            },
            _a));
        var _a;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHVwbGljYXRlUmVmZXJlbmNlc0dyYXBoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZHVwbGljYXRlUmVmZXJlbmNlc0dyYXBoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseURBQTREO0FBQzVELGlEQUFvRTtBQUNwRSw0Q0FBd0Y7QUFFaEYsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBQzNCLElBQUksYUFBeUMsQ0FBQztJQUM5QyxTQUFTLENBQUM7UUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1FBQ2hELElBQU0sUUFBUSxHQUFHLDZCQUFtQixDQUNsQztZQUNFLEdBQUcsRUFBRTtnQkFDSCxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDNUQsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQzVELEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUM1RCxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDNUQsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFF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