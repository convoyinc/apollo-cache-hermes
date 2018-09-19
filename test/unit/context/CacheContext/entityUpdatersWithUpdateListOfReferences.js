"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var graphql_tag_1 = require("graphql-tag");
var src_1 = require("../../../../src");
var helpers_1 = require("../../../helpers");
describe("context.CacheContext", function () {
    describe("entityUpdaters with updateListOfReferences", function () {
        var dashboardQuery = helpers_1.query("\n      query dashboard {\n        dashboard {\n          name\n          id\n          users(active: true) {\n            __typename\n            id\n            name\n            active\n            currentDashboard { id }\n          }\n        }\n      }\n    ");
        var getUserQuery = helpers_1.query("\n      query getUser($id: ID!) {\n        user(id: $id) {\n          __typename\n          id\n          name\n          active\n          currentDashboard { id }\n        }\n      }\n    ");
        var fooQuery = helpers_1.query("{ foo }");
        var entityUpdaters = {
            User: function (dataProxy, user, previous) {
                var nextActive = user && user.active;
                var prevActive = previous && previous.active;
                if (nextActive === prevActive)
                    return;
                var dashboardId = user ? user.currentDashboard.id : previous.currentDashboard.id;
                var userId = user ? user.id : previous.id;
                dataProxy.updateListOfReferences(dashboardId, ['users'], {
                    writeFragment: graphql_tag_1.default("\n              fragment user on User {\n                id\n              }\n            "),
                }, {
                    readFragment: graphql_tag_1.default("\n              fragment dashboard on Dashboard {\n                id\n                users(active: $active) {\n                  __typename\n                  id\n                  name\n                  active\n                  currentDashboard { id }\n                }\n              }\n            "),
                }, function (previousUsers) {
                    if (!previousUsers) {
                        return previousUsers;
                    }
                    if (!nextActive) {
                        // Remove users once they're no longer active.
                        return previousUsers.filter(function (activeUser) { return activeUser.id !== userId; });
                    }
                    else if (previousUsers.findIndex(function (u) { return u.id === userId; }) === -1) {
                        // Insert newly active users if they're not already in the list.
                        return tslib_1.__spread(previousUsers, [user]);
                    }
                    else {
                        return previousUsers; // No change.
                    }
                });
            },
            Query: function () { },
        };
        var userUpdater = jest.spyOn(entityUpdaters, 'User');
        var rootUpdater = jest.spyOn(entityUpdaters, 'Query');
        var cache;
        beforeEach(function () {
            cache = new src_1.Cache(tslib_1.__assign({}, helpers_1.strictConfig, { entityUpdaters: entityUpdaters }));
            cache.write(dashboardQuery, {
                dashboard: {
                    name: 'Main Dashboard',
                    id: 'dash0',
                    users: [
                        {
                            __typename: 'User',
                            id: 1,
                            name: 'Gouda',
                            active: true,
                            currentDashboard: { id: 'dash0' },
                        },
                        {
                            __typename: 'User',
                            id: 2,
                            name: 'Munster',
                            active: true,
                            currentDashboard: { id: 'dash0' },
                        },
                    ],
                },
            });
            userUpdater.mockClear();
            rootUpdater.mockClear();
        });
        it("triggers updaters when an entity is first seen", function () {
            cache.write(tslib_1.__assign({}, getUserQuery, { variables: { id: 3 } }), {
                user: {
                    __typename: 'User',
                    id: 3,
                    name: 'Cheddar',
                    active: true,
                    currentDashboard: { id: 'dash0' },
                },
            });
            expect(userUpdater.mock.calls.length).to.eq(1);
            var _a = tslib_1.__read(userUpdater.mock.calls[0], 3), user = _a[1], previous = _a[2];
            expect(user).to.deep.eq({
                __typename: 'User',
                id: 3,
                name: 'Cheddar',
                active: true,
                currentDashboard: {
                    id: 'dash0',
                    name: 'Main Dashboard',
                },
            });
            expect(previous).to.deep.eq(undefined);
        });
        it("triggers updaters when an entity is orphaned", function () {
            cache.write(dashboardQuery, {
                dashboard: {
                    name: 'Main Dashboard',
                    id: 'dash0',
                    users: [
                        {
                            __typename: 'User',
                            id: 2,
                            name: 'Munster',
                            active: true,
                            currentDashboard: {
                                id: 'dash0',
                                name: 'Main Dashboard',
                            },
                        },
                    ],
                },
            });
            expect(userUpdater.mock.calls.length).to.eq(1);
            var _a = tslib_1.__read(userUpdater.mock.calls[0], 3), user = _a[1], previous = _a[2];
            expect(user).to.eq(undefined);
            expect(previous).to.deep.eq({
                __typename: 'User',
                id: 1,
                name: 'Gouda',
                active: true,
                currentDashboard: {
                    id: 'dash0',
                    name: 'Main Dashboard',
                },
            });
        });
        it("respects writes by updaters", function () {
            cache.write(tslib_1.__assign({}, getUserQuery, { variables: { id: 2 } }), {
                user: {
                    __typename: 'User',
                    id: 2,
                    name: 'Munster',
                    active: false,
                    currentDashboard: {
                        id: 'dash0',
                    },
                },
            });
            expect(cache.read(dashboardQuery).result).to.deep.eq({
                dashboard: {
                    name: 'Main Dashboard',
                    id: 'dash0',
                    users: [
                        {
                            __typename: 'User',
                            id: 1,
                            name: 'Gouda',
                            active: true,
                            currentDashboard: {
                                id: 'dash0',
                                name: 'Main Dashboard',
                            },
                        },
                    ],
                },
            });
        });
        it("triggers updates to the root node via the Query type", function () {
            cache.write(fooQuery, { foo: 123 });
            expect(rootUpdater.mock.calls.length).to.eq(1);
            var _a = tslib_1.__read(rootUpdater.mock.calls[0], 3), root = _a[1], previous = _a[2];
            expect(root.foo).to.eq(123);
            expect(previous.foo).to.eq(undefined);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50aXR5VXBkYXRlcnNXaXRoVXBkYXRlTGlzdE9mUmVmZXJlbmNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVudGl0eVVwZGF0ZXJzV2l0aFVwZGF0ZUxpc3RPZlJlZmVyZW5jZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQThCO0FBRTlCLHVDQUF3QztBQUV4Qyw0Q0FBdUQ7QUFFdkQsUUFBUSxDQUFDLHNCQUFzQixFQUFFO0lBQy9CLFFBQVEsQ0FBQyw0Q0FBNEMsRUFBRTtRQUVyRCxJQUFNLGNBQWMsR0FBRyxlQUFLLENBQUMseVFBYzVCLENBQUMsQ0FBQztRQUVILElBQU0sWUFBWSxHQUFHLGVBQUssQ0FBQywrTEFVMUIsQ0FBQyxDQUFDO1FBQ0gsSUFBTSxRQUFRLEdBQUcsZUFBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRWxDLElBQU0sY0FBYyxHQUFnQztZQUNsRCxJQUFJLFlBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRO2dCQUM1QixJQUFNLFVBQVUsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDdkMsSUFBTSxVQUFVLEdBQUcsUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQy9DLEVBQUUsQ0FBQyxDQUFDLFVBQVUsS0FBSyxVQUFVLENBQUM7b0JBQUMsTUFBTSxDQUFDO2dCQUV0QyxJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7Z0JBQ25GLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFFNUMsU0FBUyxDQUFDLHNCQUFzQixDQUM5QixXQUFXLEVBQ1gsQ0FBQyxPQUFPLENBQUMsRUFDVDtvQkFDRSxh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