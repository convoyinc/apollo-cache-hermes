"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var _ = require("lodash");
var CacheSnapshot_1 = require("../../../../src/CacheSnapshot");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var operations_1 = require("../../../../src/operations");
var OptimisticUpdateQueue_1 = require("../../../../src/OptimisticUpdateQueue");
var helpers_1 = require("../../../helpers");
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
// same as cache snapshot created by `createNewCacheShapshot1` plus the
// `user(id: $id)` parameterized field
function createNewCacheSnapshot2(cacheContext) {
    var snapshot = helpers_1.createGraphSnapshot({
        foo: 123,
        bar: 'asdf',
        viewer: {
            id: 'a',
            first: 'Jonh',
            last: 'Doe',
            __typename: 'Viewer',
        },
        user: {
            id: 'xxx',
            first: 'YoYo',
            last: 'Ma',
            __typename: 'User',
        },
    }, "query dummy($id: ID) { \n      foo\n      bar\n      viewer { id first last __typename }\n      user(id: $id) { id first last __typename }\n    }", cacheContext, { id: 'xxx' });
    return new CacheSnapshot_1.CacheSnapshot(snapshot, snapshot, new OptimisticUpdateQueue_1.OptimisticUpdateQueue());
}
// same as cache snapshot created by `createNewCacheShapshot` plus the
// `friends(circle: $circle)` parameterized field
function createNewCacheSnapshot3(cacheContext) {
    var snapshot = helpers_1.createGraphSnapshot({
        foo: 123,
        bar: 'asdf',
        viewer: {
            id: 'a',
            first: 'Jonh',
            last: 'Doe',
            __typename: 'Viewer',
            friends: [{
                    id: 'friend-1',
                    first: 'Bob',
                    last: 'Breaker',
                    __typename: 'Friend',
                }, {
                    id: 'friend-2',
                    first: 'Susan',
                    last: 'Fixer',
                    __typename: 'Friend',
                }],
        },
    }, "query dummy($circle: String) { \n      foo\n      bar\n      viewer {\n        id\n        first\n        last\n        __typename\n        friends(circle: $circle) { id first last }\n      }\n    }", cacheContext, { circle: 'elementary' });
    return new CacheSnapshot_1.CacheSnapshot(snapshot, snapshot, new OptimisticUpdateQueue_1.OptimisticUpdateQueue());
}
describe("operations.migrate", function () {
    var cacheContext;
    // let cacheSnapshot: CacheSnapshot;
    beforeAll(function () {
        cacheContext = new CacheContext_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { freeze: false }));
    });
    it("can add parameterized fields to root", function () {
        var migrationMap = {
            _parameterized: {
                Query: [{
                        path: ['user'],
                        args: { id: 'xxx' },
                        defaultReturn: null,
                    }],
            },
        };
        var migrated = operations_1.migrate(createNewCacheSnapshot(cacheContext), migrationMap);
        var _a = operations_1.read(cacheContext, helpers_1.query("\n      query dummy($id: ID) {\n        foo\n        bar\n        user(id: $id)\n      }\n    ", { id: 'xxx' }), migrated.baseline), result = _a.result, complete = _a.complete;
        expect(complete).to.be.true;
        expect(_.get(result, 'user')).to.be.null;
    });
    it("doesn't wipe out compatable parameterized fields at root", function () {
        var migrationMap = {
            _parameterized: {
                Query: [{
                        path: ['user'],
                        args: { id: 'xxx' },
                        defaultReturn: null,
                    }],
            },
        };
        // start with a snapshot with user(id: $id) already in place at root
        var snapshot = createNewCacheSnapshot2(cacheContext);
        var migrated = operations_1.migrate(snapshot, migrationMap);
        // migration should yield no change to the user(id: $id) parameterized field
        var _a = operations_1.read(cacheContext, helpers_1.query("\n      query dummy($id: ID) {\n        foo\n        bar\n        user(id: $id) {\n          id\n          first\n          last\n        }\n      }\n    ", { id: 'xxx' }), migrated.baseline), result = _a.result, complete = _a.complete;
        expect(complete).to.be.true;
        expect(_.get(result, 'user')).to.deep.equal({
            id: 'xxx',
            first: 'YoYo',
            last: 'Ma',
            __typename: 'User',
        });
    });
    it("can modify the signature of existing parameterized fields at root", function () {
        var migrationMap = {
            _parameterized: (_a = {},
                _a['Query'] = [{
                        path: ['user'],
                        args: { id: 'xxx', extraInfo: true },
                        defaultReturn: null,
                    }],
                _a),
        };
        // start with a snapshot with user(id: $id) already in place at root
        var snapshot = createNewCacheSnapshot2(cacheContext);
        var migrated = operations_1.migrate(snapshot, migrationMap);
        // read for the old parameterized field should no longer succeed
        var _b = operations_1.read(cacheContext, helpers_1.query("\n      query dummy($id: ID) {\n        foo\n        bar\n        user(id: $id, extraInfo: true)\n      }\n    ", { id: 'xxx' }), migrated.baseline), result = _b.result, complete = _b.complete;
        expect(complete).to.be.true;
        expect(_.get(result, 'user')).to.eq(null);
        var _a;
    });
    it("can add parameterized fields to entity", function () {
        var migrationMap = {
            _parameterized: (_a = {},
                _a['Viewer'] = [{
                        path: ['friends'],
                        args: { circle: 'elementary' },
                        defaultReturn: [],
                    }],
                _a),
        };
        var migrated = operations_1.migrate(createNewCacheSnapshot(cacheContext), migrationMap);
        var _b = operations_1.read(cacheContext, helpers_1.query("\n      query dummy($circle: String) {\n        foo\n        bar\n        viewer {\n          id\n          friends(circle: $circle) {\n            id\n            first\n            last\n          }\n        }\n      }\n    ", { circle: 'elementary' }), migrated.baseline), result = _b.result, complete = _b.complete;
        expect(complete).to.be.true;
        expect(_.get(result, ['viewer', 'friends'])).to.deep.eq([]);
        var _a;
    });
    it("doesn't wipe out compatable parameterized fields on entity", function () {
        var migrationMap = {
            _parameterized: {
                Viewer: [{
                        path: ['friends'],
                        args: { circle: 'elementary' },
                        defaultReturn: [],
                    }],
            },
        };
        // start with a snapshot with user(id: $id) already in place at root
        var snapshot = createNewCacheSnapshot3(cacheContext);
        var migrated = operations_1.migrate(snapshot, migrationMap);
        // migration should yield no change to the user(id: $id) parameterized field
        var _a = operations_1.read(cacheContext, helpers_1.query("\n      query dummy($circle: String) {\n        foo\n        bar\n        viewer {\n          id\n          friends(circle: $circle) {\n            id\n            first\n            last\n          }\n        }\n      }\n    ", { circle: 'elementary' }), migrated.baseline), result = _a.result, complete = _a.complete;
        expect(complete).to.be.true;
        expect(_.get(result, ['viewer', 'friends'])).to.deep.equal([{
                id: 'friend-1',
                first: 'Bob',
                last: 'Breaker',
            }, {
                id: 'friend-2',
                first: 'Susan',
                last: 'Fixer',
            }]);
    });
    it("can modify parameterized fields of entity", function () {
        var migrationMap = {
            _parameterized: {
                Viewer: [{
                        path: ['friends'],
                        args: { circle: 'elementary', stillFriends: true },
                        defaultReturn: [],
                    }],
            },
        };
        var migrated = operations_1.migrate(createNewCacheSnapshot3(cacheContext), migrationMap);
        var _a = operations_1.read(cacheContext, helpers_1.query("\n      query dummy($circle: String, $stillFriends: Boolean) {\n        foo\n        bar\n        viewer {\n          id\n          friends(circle: $circle, stillFriends: $stillFriends) {\n            id\n            first\n            last\n          }\n        }\n      }\n    ", { circle: 'elementary', stillFriends: true }), migrated.baseline), result = _a.result, complete = _a.complete;
        expect(complete).to.be.true;
        expect(_.get(result, ['viewer', 'friends'])).to.deep.eq([]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50aXRpZXNXaXRoUGFyYW1ldGVyaXplZEZpZWxkcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVudGl0aWVzV2l0aFBhcmFtZXRlcml6ZWRGaWVsZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMEJBQTRCO0FBRTVCLCtEQUE4RDtBQUM5RCxxRUFBb0U7QUFDcEUseURBQXlFO0FBQ3pFLCtFQUE4RTtBQUM5RSw0Q0FBNEU7QUFFNUUsZ0NBQWdDLFlBQTBCO0lBQ3hELElBQU0sUUFBUSxHQUFHLDZCQUFtQixDQUNsQztRQUNFLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLE1BQU07UUFDWCxNQUFNLEVBQUU7WUFDTixFQUFFLEVBQUUsR0FBRztZQUNQLEtBQUssRUFBRSxNQUFNO1lBQ2IsSUFBSSxFQUFFLEtBQUs7WUFDWCxVQUFVLEVBQUUsUUFBUTtTQUNyQjtLQUNGLEVBQ0QsaURBQWlELEVBQ2pELFlBQVksQ0FDYixDQUFDO0lBQ0YsTUFBTSxDQUFDLElBQUksNkJBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksNkNBQXFCLEVBQUUsQ0FBQyxDQUFDO0FBQzVFLENBQUM7QUFFRCx1RUFBdUU7QUFDdkUsc0NBQXNDO0FBQ3RDLGlDQUFpQyxZQUEwQjtJQUN6RCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7UUFDRSxHQUFHLEVBQUUsR0FBRztRQUNSLEdBQUcsRUFBRSxNQUFNO1FBQ1gsTUFBTSxFQUFFO1lBQ04sRUFBRSxFQUFFLEdBQUc7WUFDUCxLQUFLLEVBQUUsTUFBTTtZQUNiLElBQUksRUFBRSxLQUFLO1lBQ1gsVUFBVSxFQUFFLFFBQVE7U0FDckI7UUFDRCxJQUFJLEVBQUU7WUFDSixFQUFFLEVBQUUsS0FBSztZQUNULEtBQUssRUFBRSxNQUFNO1lBQ2IsSUFBSSxFQUFFLElBQUk7WUFDVixVQUFVLEVBQUUsTUFBTTtTQUNuQjtLQUNGLEVBQ0QsbUpBS0UsRUFDRixZQUFZLEVBQ1osRUFB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