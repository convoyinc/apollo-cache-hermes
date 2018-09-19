"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var graphql_tag_1 = require("graphql-tag");
var src_1 = require("../../../../src");
var helpers_1 = require("../../../helpers");
describe("context.CacheContext", function () {
    describe("entityUpdaters with updateListOfReference during optimistic change", function () {
        var dashboardQuery = helpers_1.query("\n      query dashboard {\n        dashboard {\n          name\n          id\n          users(active: true) {\n            __typename\n            id\n            name\n            active\n            currentDashboard { id }\n          }\n        }\n      }\n    ");
        var getUserQuery = helpers_1.query("\n      query getUser($id: ID!) {\n        user(id: $id) {\n          __typename\n          id\n          name\n          active\n          currentDashboard { id }\n        }\n      }\n    ");
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
                    readFragment: graphql_tag_1.default("\n              fragment dashboard on Dashboard {\n                users(active: $active) {\n                  __typename\n                  id\n                  name\n                  active\n                  currentDashboard { id }\n                }\n              }\n            "),
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
        it("triggers updaters when an entity is added", function () {
            cache.transaction(
            /** changeIdOrCallback */ 'opt0', function (transaction) {
                transaction.write(tslib_1.__assign({}, getUserQuery, { variables: { id: 4 } }), {
                    user: {
                        __typename: 'User',
                        id: 3,
                        name: 'Cheddar',
                        active: true,
                        currentDashboard: { id: 'dash0' },
                    },
                });
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
            cache.transaction(
            /** changeIdOrCallback */ 'opt1', function (transaction) {
                transaction.write(dashboardQuery, {
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
            cache.transaction(
            /** changeIdOrCallback */ 'opt2', function (transaction) {
                transaction.write(tslib_1.__assign({}, getUserQuery, { variables: { id: 2 } }), {
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
            expect(cache.read(dashboardQuery, /* optimistic */ true).result).to.deep.eq({
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
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50aXR5VXBkYXRlcnNXaXRoVXBkYXRlTGlzdE9mUmVmZXJlbmNlc0luT3B0aW1pc3RpY0NoYW5nZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVudGl0eVVwZGF0ZXJzV2l0aFVwZGF0ZUxpc3RPZlJlZmVyZW5jZXNJbk9wdGltaXN0aWNDaGFuZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQThCO0FBRTlCLHVDQUF3QztBQUV4Qyw0Q0FBdUQ7QUFFdkQsUUFBUSxDQUFDLHNCQUFzQixFQUFFO0lBQy9CLFFBQVEsQ0FBQyxvRUFBb0UsRUFBRTtRQUU3RSxJQUFNLGNBQWMsR0FBRyxlQUFLLENBQUMseVFBYzVCLENBQUMsQ0FBQztRQUVILElBQU0sWUFBWSxHQUFHLGVBQUssQ0FBQywrTEFVMUIsQ0FBQyxDQUFDO1FBRUgsSUFBTSxjQUFjLEdBQWdDO1lBQ2xELElBQUksWUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVE7Z0JBQzVCLElBQU0sVUFBVSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUN2QyxJQUFNLFVBQVUsR0FBRyxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQztnQkFDL0MsRUFBRSxDQUFDLENBQUMsVUFBVSxLQUFLLFVBQVUsQ0FBQztvQkFBQyxNQUFNLENBQUM7Z0JBRXRDLElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztnQkFDbkYsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUU1QyxTQUFTLENBQUMsc0JBQXNCLENBQzlCLFdBQVcsRUFDWCxDQUFDLE9BQU8sQ0FBQyxFQUNUO29CQUNFLGFBQWEsRUFBRSxx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