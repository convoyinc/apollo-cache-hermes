"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var GraphSnapshot_1 = require("../../../../src/GraphSnapshot");
var EntitySnapshot_1 = require("../../../../src/nodes/EntitySnapshot");
var OptimisticUpdateQueue_1 = require("../../../../src/OptimisticUpdateQueue");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("context.CacheContext", function () {
    describe("onChange callback", function () {
        var mockOnChange = jest.fn();
        var graphqlQuery = helpers_1.query("{\n      foo {\n        id\n        bar {\n          id\n          name\n        }\n      }\n    }");
        var cache = new src_1.Cache(tslib_1.__assign({}, helpers_1.strictConfig, { onChange: mockOnChange }));
        it("trigger onChange callback when write to cache", function () {
            cache.write(graphqlQuery, {
                foo: {
                    id: 0,
                    bar: {
                        id: 1,
                        name: 'Gouda',
                    },
                },
            });
            var bar = { id: 1, name: 'Gouda' };
            var foo = {
                id: 0,
                bar: bar,
            };
            var _values = (_a = {
                    '0': new EntitySnapshot_1.EntitySnapshot(foo, 
                    /* inbound */ [{ id: QueryRootId, path: ['foo'] }], 
                    /* outbound */ [{ id: '1', path: ['bar'] }]),
                    '1': new EntitySnapshot_1.EntitySnapshot(bar, 
                    /* inbound */ [{ id: '0', path: ['bar'] }], 
                    /* outbound */ undefined)
                },
                _a[QueryRootId] = new EntitySnapshot_1.EntitySnapshot({
                    foo: foo,
                }, 
                /* inbound */ undefined, 
                /* outbound */ [{ id: '0', path: ['foo'] }]),
                _a);
            expect(mockOnChange.mock.calls.length).to.equal(1);
            expect(mockOnChange.mock.calls[0][0]).to.deep.equal({
                baseline: new GraphSnapshot_1.GraphSnapshot(_values),
                optimistic: new GraphSnapshot_1.GraphSnapshot(_values),
                optimisticQueue: new OptimisticUpdateQueue_1.OptimisticUpdateQueue(),
            });
            expect(mockOnChange.mock.calls[0][1]).to.deep.equal(new Set([QueryRootId, '0', '1']));
            mockOnChange.mockClear();
            var _a;
        });
        it("trigger onChange callback when write with transaction", function () {
            cache.transaction(function (transaction) {
                transaction.write(graphqlQuery, {
                    foo: {
                        id: 0,
                        bar: {
                            id: 1,
                            name: 'Munster',
                        },
                    },
                });
            });
            var bar = { id: 1, name: 'Munster' };
            var foo = {
                id: 0,
                bar: bar,
            };
            var _values = (_a = {
                    '0': new EntitySnapshot_1.EntitySnapshot(foo, 
                    /* inbound */ [{ id: QueryRootId, path: ['foo'] }], 
                    /* outbound */ [{ id: '1', path: ['bar'] }]),
                    '1': new EntitySnapshot_1.EntitySnapshot(bar, 
                    /* inbound */ [{ id: '0', path: ['bar'] }], 
                    /* outbound */ undefined)
                },
                _a[QueryRootId] = new EntitySnapshot_1.EntitySnapshot({
                    foo: foo,
                }, 
                /* inbound */ undefined, 
                /* outbound */ [{ id: '0', path: ['foo'] }]),
                _a);
            expect(mockOnChange.mock.calls.length).to.equal(1);
            expect(mockOnChange.mock.calls[0][0]).to.deep.equal({
                baseline: new GraphSnapshot_1.GraphSnapshot(_values),
                optimistic: new GraphSnapshot_1.GraphSnapshot(_values),
                optimisticQueue: new OptimisticUpdateQueue_1.OptimisticUpdateQueue(),
            });
            expect(mockOnChange.mock.calls[0][1]).to.deep.equal(new Set(['1']));
            mockOnChange.mockClear();
            var _a;
        });
        it("do not trigger onChange callback on read", function () {
            cache.read(graphqlQuery);
            expect(mockOnChange.mock.calls.length).to.equal(0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25DaGFuZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvbkNoYW5nZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1Q0FBd0M7QUFDeEMsK0RBQThEO0FBQzlELHVFQUFzRTtBQUN0RSwrRUFBOEU7QUFDOUUsaURBQXNEO0FBQ3RELDRDQUF1RDtBQUUvQyxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsc0JBQXNCLEVBQUU7SUFDL0IsUUFBUSxDQUFDLG1CQUFtQixFQUFFO1FBQzVCLElBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMvQixJQUFNLFlBQVksR0FBRyxlQUFLLENBQUMsb0dBUXpCLENBQUMsQ0FBQztRQUVKLElBQU0sS0FBSyxHQUFHLElBQUksV0FBSyxzQkFBTSxzQkFBWSxJQUFFLFFBQVEsRUFBRSxZQUFZLElBQUcsQ0FBQztRQUVyRSxFQUFFLENBQUMsK0NBQStDLEVBQUU7WUFDbEQsS0FBSyxDQUFDLEtBQUssQ0FDVCxZQUFZLEVBQ1o7Z0JBQ0UsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxDQUFDO29CQUNMLEdBQUcsRUFBRTt3QkFDSCxFQUFFLEVBQUUsQ0FBQzt3QkFDTCxJQUFJLEVBQUUsT0FBTztxQkFDZDtpQkFDRjthQUNGLENBQ0YsQ0FBQztZQUVGLElBQU0sR0FBRyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDckMsSUFBTSxHQUFHLEdBQUc7Z0JBQ1YsRUFBRSxFQUFFLENBQUM7Z0JBQ0wsR0FBRyxLQUFBO2FBQ0osQ0FBQztZQUVGLElBQU0sT0FBTztvQkFDWCxHQUFHLEVBQUUsSUFBSSwrQkFBYyxDQUNyQixHQUFHO29CQUNILGFBQWEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNsRCxjQUFjLENBQUMs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