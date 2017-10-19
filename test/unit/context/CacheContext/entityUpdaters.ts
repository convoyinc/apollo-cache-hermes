import { Cache } from '../../../../src';
import { CacheContext } from '../../../../src/context';
import { query, strictConfig } from '../../../helpers';

describe(`operations.read`, () => {
  describe(`with entity updaters`, () => {

    const activeUsersQuery = query(`{
      activeUsers { __typename id name active }
    }`);
    const getUserQuery = query(`
      query getUser($id: ID!) {
        user(id: $id) { __typename id name active }
      }
    `);
    const fooQuery = query(`{ foo }`);

    const entityUpdaters: CacheContext.EntityUpdaters = {
      User(dataProxy, user, previous) {
        const nextActive = user && user.active;
        const prevActive = previous && previous.active;
        if (nextActive === prevActive) return;

        const userId = user ? user.id : previous.id;
        const { activeUsers } = dataProxy.readQuery({ query: activeUsersQuery.document });
        let newActiveUsers: any[];
        if (!nextActive) {
          // Remove users once they're no longer active.
          newActiveUsers = activeUsers.filter((activeUser: any) => activeUser.id !== userId);
        } else if (activeUsers.findIndex((u: any) => u.id === userId) === -1) {
          // Insert newly active users if they're not already in the list.
          newActiveUsers = [...activeUsers, user];
        } else {
          return; // No change.
        }

        if (newActiveUsers.length === activeUsers.length) return; // No change.

        dataProxy.writeQuery({
          query: activeUsersQuery.document,
          data: { activeUsers: newActiveUsers },
        });
      },

      Query() {},
    };

    const userUpdater = jest.spyOn(entityUpdaters, 'User');
    const rootUpdater = jest.spyOn(entityUpdaters, 'Query');

    let cache: Cache;
    beforeEach(() => {
      cache = new Cache({ ...strictConfig, entityUpdaters });
      cache.write(activeUsersQuery, {
        activeUsers: [
          { __typename: 'User', id: 1, name: 'Gouda', active: true },
          { __typename: 'User', id: 2, name: 'Munster', active: true },
        ],
      });

      userUpdater.mockClear();
      rootUpdater.mockClear();
    });

    it(`triggers updaters when an entity is first seen`, () => {
      cache.write({ ...getUserQuery, variables: { id: 3 } }, {
        user: { __typename: 'User', id: 3, name: 'Cheddar', active: true },
      });

      expect(userUpdater.mock.calls.length).to.eq(1);
      const [, user, previous] = userUpdater.mock.calls[0];
      expect(user).to.deep.eq({ __typename: 'User', id: 3, name: 'Cheddar', active: true });
      expect(previous).to.deep.eq(undefined);
    });

    it(`triggers updaters when an entity is orphaned`, () => {
      cache.write(activeUsersQuery, {
        activeUsers: [
          { __typename: 'User', id: 2, name: 'Munster', active: true },
        ],
      });

      expect(userUpdater.mock.calls.length).to.eq(1);
      const [, user, previous] = userUpdater.mock.calls[0];
      expect(user).to.eq(undefined);
      expect(previous).to.deep.eq({ __typename: 'User', id: 1, name: 'Gouda', active: true });
    });

    it(`respects writes by updaters`, () => {
      cache.write({ ...getUserQuery, variables: { id: 2 } }, {
        user: { __typename: 'User', id: 2, name: 'Munster', active: false },
      });

      expect(cache.read(activeUsersQuery).result).to.deep.eq({
        activeUsers: [
          { __typename: 'User', id: 1, name: 'Gouda', active: true },
        ],
      });
    });

    it(`triggers updates to the root node via the Query type`, () => {
      cache.write(fooQuery, { foo: 123 });
      expect(rootUpdater.mock.calls.length).to.eq(1);
      const [, root, previous] = rootUpdater.mock.calls[0];
      expect(root.foo).to.eq(123);
      expect(previous.foo).to.eq(undefined);
    });

  });
});
