"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var helpers_1 = require("../../../helpers");
describe("context.CacheContext", function () {
    describe("entity updaters", function () {
        var activeUsersQuery = helpers_1.query("{\n      activeUsers { __typename id name active }\n    }");
        var getUserQuery = helpers_1.query("\n      query getUser($id: ID!) {\n        user(id: $id) { __typename id name active }\n      }\n    ");
        var fooQuery = helpers_1.query("{ foo }");
        var entityUpdaters = {
            User: function (dataProxy, user, previous) {
                var nextActive = user && user.active;
                var prevActive = previous && previous.active;
                if (nextActive === prevActive)
                    return;
                var userId = user ? user.id : previous.id;
                var activeUsers = dataProxy.readQuery({ query: activeUsersQuery.document }).activeUsers;
                var newActiveUsers;
                if (!nextActive) {
                    // Remove users once they're no longer active.
                    newActiveUsers = activeUsers.filter(function (activeUser) { return activeUser.id !== userId; });
                }
                else if (activeUsers.findIndex(function (u) { return u.id === userId; }) === -1) {
                    // Insert newly active users if they're not already in the list.
                    newActiveUsers = tslib_1.__spread(activeUsers, [user]);
                }
                else {
                    return; // No change.
                }
                if (newActiveUsers.length === activeUsers.length)
                    return; // No change.
                dataProxy.writeQuery({
                    query: activeUsersQuery.document,
                    data: { activeUsers: newActiveUsers },
                });
            },
            Query: function () { },
        };
        var userUpdater = jest.spyOn(entityUpdaters, 'User');
        var rootUpdater = jest.spyOn(entityUpdaters, 'Query');
        var cache;
        beforeEach(function () {
            cache = new src_1.Cache(tslib_1.__assign({}, helpers_1.strictConfig, { entityUpdaters: entityUpdaters }));
            cache.write(activeUsersQuery, {
                activeUsers: [
                    { __typename: 'User', id: 1, name: 'Gouda', active: true },
                    { __typename: 'User', id: 2, name: 'Munster', active: true },
                ],
            });
            userUpdater.mockClear();
            rootUpdater.mockClear();
        });
        it("triggers updaters when an entity is first seen", function () {
            cache.write(tslib_1.__assign({}, getUserQuery, { variables: { id: 3 } }), {
                user: { __typename: 'User', id: 3, name: 'Cheddar', active: true },
            });
            expect(userUpdater.mock.calls.length).to.eq(1);
            var _a = tslib_1.__read(userUpdater.mock.calls[0], 3), user = _a[1], previous = _a[2];
            expect(user).to.deep.eq({ __typename: 'User', id: 3, name: 'Cheddar', active: true });
            expect(previous).to.deep.eq(undefined);
        });
        it("triggers updaters when an entity is orphaned", function () {
            cache.write(activeUsersQuery, {
                activeUsers: [
                    { __typename: 'User', id: 2, name: 'Munster', active: true },
                ],
            });
            expect(userUpdater.mock.calls.length).to.eq(1);
            var _a = tslib_1.__read(userUpdater.mock.calls[0], 3), user = _a[1], previous = _a[2];
            expect(user).to.eq(undefined);
            expect(previous).to.deep.eq({ __typename: 'User', id: 1, name: 'Gouda', active: true });
        });
        it("respects writes by updaters", function () {
            cache.write(tslib_1.__assign({}, getUserQuery, { variables: { id: 2 } }), {
                user: { __typename: 'User', id: 2, name: 'Munster', active: false },
            });
            expect(cache.read(activeUsersQuery).result).to.deep.eq({
                activeUsers: [
                    { __typename: 'User', id: 1, name: 'Gouda', active: true },
                ],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50aXR5VXBkYXRlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbnRpdHlVcGRhdGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1Q0FBd0M7QUFFeEMsNENBQXVEO0FBRXZELFFBQVEsQ0FBQyxzQkFBc0IsRUFBRTtJQUMvQixRQUFRLENBQUMsaUJBQWlCLEVBQUU7UUFFMUIsSUFBTSxnQkFBZ0IsR0FBRyxlQUFLLENBQUMsMkRBRTdCLENBQUMsQ0FBQztRQUNKLElBQU0sWUFBWSxHQUFHLGVBQUssQ0FBQyx1R0FJMUIsQ0FBQyxDQUFDO1FBQ0gsSUFBTSxRQUFRLEdBQUcsZUFBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRWxDLElBQU0sY0FBYyxHQUFnQztZQUNsRCxJQUFJLFlBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRO2dCQUM1QixJQUFNLFVBQVUsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDdkMsSUFBTSxVQUFVLEdBQUcsUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQy9DLEVBQUUsQ0FBQyxDQUFDLFVBQVUsS0FBSyxVQUFVLENBQUM7b0JBQUMsTUFBTSxDQUFDO2dCQUV0QyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BDLElBQUEsbUZBQVcsQ0FBK0Q7Z0JBQ2xGLElBQUksY0FBcUIsQ0FBQztnQkFDMUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUNoQiw4Q0FBOEM7b0JBQzlDLGNBQWMsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLFVBQUMsVUFBZSxJQUFLLE9BQUEsVUFBVSxDQUFDLEVBQUUsS0FBSyxNQUFNLEVBQXhCLENBQXdCLENBQUMsQ0FBQztnQkFDckYsQ0FBQztnQkFBQyxJQUFJLENBQUMsRUFBRSxD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