"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var CacheSnapshot_1 = require("../../../../src/CacheSnapshot");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var operations_1 = require("../../../../src/operations");
var OptimisticUpdateQueue_1 = require("../../../../src/OptimisticUpdateQueue");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
function createNewCacheSnapshot(cacheContext) {
    var snapshot = helpers_1.createGraphSnapshot({
        foo: 123,
        bar: 'asdf',
        viewer: {
            id: 'a',
            first: 'Jonh',
            last: 'Doe',
            __typename: 'Viewer',
        },
    }, "{ foo bar viewer { id first last __typename } }", cacheContext);
    return new CacheSnapshot_1.CacheSnapshot(snapshot, snapshot, new OptimisticUpdateQueue_1.OptimisticUpdateQueue());
}
describe("operations.migrate", function () {
    var cacheContext;
    // let cacheSnapshot: CacheSnapshot;
    beforeAll(function () {
        cacheContext = new CacheContext_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { freeze: false }));
    });
    it("can add fields to root", function () {
        var migrated = operations_1.migrate(createNewCacheSnapshot(cacheContext), {
            _entities: {
                Query: {
                    extra: function (_previous) { return ''; },
                },
            },
        });
        var cacheAfter = operations_1.extract(migrated.baseline, cacheContext);
        expect(cacheAfter).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                data: {
                    foo: 123,
                    bar: 'asdf',
                    extra: '',
                    'viewer': undefined,
                },
                outbound: [{
                        id: 'a', path: ['viewer'],
                    }],
            },
            _a['a'] = {
                type: 0 /* EntitySnapshot */,
                data: {
                    id: 'a',
                    first: 'Jonh',
                    last: 'Doe',
                    __typename: 'Viewer',
                },
                inbound: [{ id: QueryRootId, path: ['viewer'] }],
            },
            _a));
        var _a;
    });
    it("can modify fields to root", function () {
        var migrated = operations_1.migrate(createNewCacheSnapshot(cacheContext), {
            _entities: {
                Query: {
                    foo: function (_previous) { return 456; },
                    bar: function (_previous) { return 'woohoo'; },
                },
            },
        });
        var cacheAfter = operations_1.extract(migrated.baseline, cacheContext);
        expect(cacheAfter).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                data: {
                    foo: 456,
                    bar: 'woohoo',
                    'viewer': undefined,
                },
                outbound: [{
                        id: 'a', path: ['viewer'],
                    }],
            },
            _a['a'] = {
                type: 0 /* EntitySnapshot */,
                data: {
                    id: 'a',
                    first: 'Jonh',
                    last: 'Doe',
                    __typename: 'Viewer',
                },
                inbound: [{ id: QueryRootId, path: ['viewer'] }],
            },
            _a));
        var _a;
    });
    it("can add fields to non-root entites", function () {
        var migrated = operations_1.migrate(createNewCacheSnapshot(cacheContext), {
            _entities: {
                Viewer: {
                    suffix: function (_previous) { return 'Dr'; },
                },
            },
        });
        var cacheAfter = operations_1.extract(migrated.baseline, cacheContext);
        expect(cacheAfter).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                data: {
                    foo: 123,
                    bar: 'asdf',
                    'viewer': undefined,
                },
                outbound: [{
                        id: 'a', path: ['viewer'],
                    }],
            },
            _a['a'] = {
                type: 0 /* EntitySnapshot */,
                data: {
                    id: 'a',
                    first: 'Jonh',
                    last: 'Doe',
                    suffix: 'Dr',
                    __typename: 'Viewer',
                },
                inbound: [{ id: QueryRootId, path: ['viewer'] }],
            },
            _a));
        var _a;
    });
    it("can modify fields of non-root entities", function () {
        var migrated = operations_1.migrate(createNewCacheSnapshot(cacheContext), {
            _entities: {
                Viewer: {
                    first: function (_previous) { return 'Adam'; },
                    last: function (_previous) { return 'Smith'; },
                },
            },
        });
        var cacheAfter = operations_1.extract(migrated.baseline, cacheContext);
        expect(cacheAfter).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                data: {
                    foo: 123,
                    bar: 'asdf',
                    'viewer': undefined,
                },
                outbound: [{
                        id: 'a', path: ['viewer'],
                    }],
            },
            _a['a'] = {
                type: 0 /* EntitySnapshot */,
                data: {
                    id: 'a',
                    first: 'Adam',
                    last: 'Smith',
                    __typename: 'Viewer',
                },
                inbound: [{ id: QueryRootId, path: ['viewer'] }],
            },
            _a));
        var _a;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50aXR5TWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVudGl0eU1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0RBQThEO0FBQzlELHFFQUFvRTtBQUNwRSx5REFBOEQ7QUFDOUQsK0VBQThFO0FBRTlFLGlEQUFvRTtBQUNwRSw0Q0FBcUU7QUFFN0QsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0NBQWdDLFlBQTBCO0lBQ3hELElBQU0sUUFBUSxHQUFHLDZCQUFtQixDQUNsQztRQUNFLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLE1BQU07UUFDWCxNQUFNLEVBQUU7WUFDTixFQUFFLEVBQUUsR0FBRztZQUNQLEtBQUssRUFBRSxNQUFNO1lBQ2IsSUFBSSxFQUFFLEtBQUs7WUFDWCxVQUFVLEVBQUUsUUFBUTtTQUNyQjtLQUNGLEVBQ0QsaURBQWlELEVBQ2pELFlBQVksQ0FDYixDQUFDO0lBQ0YsTUFBTSxDQUFDLElBQUksNkJBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksNkNBQXFCLEVBQUUsQ0FBQyxDQUFDO0FBQzVFLENBQUM7QUFFRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsSUFBSSxZQUEwQixDQUFDO0lBQy9CLG9DQUFvQztJQUNwQyxTQUFTLENBQUM7UUFDUixZQUFZLEdBQUcsSUFBSSwyQkFBWSxzQkFBTSxzQkFBWSxJQUFFLE1BQU0sRUFBRSxLQUFLLElBQUcsQ0FBQztJQUN0RSxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyx3QkFBd0IsRUFBRTtRQUMzQixJQUFNLFFBQVEsR0FBRyxvQkFBTyxDQUFDLHNCQUFzQixDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQzdELFNBQVMsRUFBRTtnQkFDVCxLQUFLLEVBQUU7b0JBQ0wsS0FBSyxFQUFFLFVBQUMsU0FBb0IsSUFBSyxPQUFBLEVBQUUsRUFBRixDQUFFO2lCQUNwQzthQUNGO1NBQ0YsQ0FBQyxD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