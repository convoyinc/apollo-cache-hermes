"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../src/operations/extract");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("duplicate GraphSnapshot", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                foo: [
                    { id: 'a', bar: { id: 1 } },
                    { id: 'a', bar: { id: 1 } },
                    { id: 'b', bar: { id: 1 } },
                    { id: 'a', bar: { id: 1 } },
                    { id: 'b', bar: { id: 1 } },
                ],
                baz: {
                    id: 'a', bar: { id: 1 },
                },
            }, "{\n          foo {\n            id\n            bar { id }\n          }\n          baz {\n            id\n            bar { id }\n          }\n        }", cacheContext);
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHVwbGljYXRlUmVmZXJlbmNlc0dyYXBoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZHVwbGljYXRlUmVmZXJlbmNlc0dyYXBoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsOERBQTZEO0FBQzdELGlEQUFvRTtBQUNwRSw0Q0FBaUY7QUFFekUsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRTtRQUVsQyxJQUFJLGFBQXlDLENBQUM7UUFDOUMsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztZQUNoRCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7Z0JBQ0UsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzNCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzNCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzNCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzNCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7aUJBQzVCO2dCQUNELEdBQUcsRUFBRTtvQkFDSCxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7aUJBQ3hCO2FBQ0YsRUFDRCwwSkFTRSxFQUNGLFlBQVksQ0FDYixDQUFDO1lBRUYsYUFBYSxHQUFHLGlCQUFPLENBQUMsUUFBUSxFQUFFLFlB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