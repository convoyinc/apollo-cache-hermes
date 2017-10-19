import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { read, write } from '../../../../src/operations';
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

    const context = new CacheContext({
      ...strictConfig,
      entityUpdaters: {
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
      },
    });

    const baseSnapshot = write(context, new GraphSnapshot(), activeUsersQuery, {
      activeUsers: [
        { __typename: 'User', id: 1, name: 'Gouda', active: true },
        { __typename: 'User', id: 2, name: 'Munster', active: true },
      ],
    }).snapshot;

    it(`triggers updaters when an entity is first seen`, () => {
      const userUpdater = jest.spyOn(context.entityUpdaters, 'User');

      write(context, baseSnapshot, { ...getUserQuery, variables: { id: 3 } }, {
        user: { __typename: 'User', id: 3, name: 'Cheddar', active: true },
      });

      const dataProxy = userUpdater.mock.calls[0][0];
      expect(userUpdater.mock.calls).to.deep.eq([
        dataProxy,
        { __typename: 'User', id: 3, name: 'Cheddar', active: true },
        undefined,
      ]);
    });

    it(`triggers updaters when an entity is orphaned`, () => {
      const userUpdater = jest.spyOn(context.entityUpdaters, 'User');

      write(context, baseSnapshot, activeUsersQuery, {
        activeUsers: [
          { __typename: 'User', id: 2, name: 'Munster', active: true },
        ],
      });

      const dataProxy = userUpdater.mock.calls[0][0];
      expect(userUpdater.mock.calls).to.deep.eq([
        dataProxy,
        undefined,
        { __typename: 'User', id: 1, name: 'Gouda', active: true },
      ]);
    });

    it(`respects writes by updaters`, () => {
      const { snapshot } = write(context, baseSnapshot, { ...getUserQuery, variables: { id: 2 } }, {
        user: { __typename: 'User', id: 2, name: 'Munster', active: false },
      });

      expect(read(context, activeUsersQuery, snapshot)).to.deep.eq({
        activeUsers: [
          { __typename: 'User', id: 1, name: 'Gouda', active: true },
        ],
      });
    });

  });
});
