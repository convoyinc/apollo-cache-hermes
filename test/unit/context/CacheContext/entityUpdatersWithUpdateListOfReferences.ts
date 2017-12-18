import gql from 'graphql-tag';

import { Cache } from '../../../../src';
import { CacheContext } from '../../../../src/context';
import { query, strictConfig } from '../../../helpers';

describe(`context.CacheContext`, () => {
  describe(`entityUpdaters with updateListOfReferences`, () => {

    const dashboardQuery = query(`
      query dashboard {
        dashboard {
          name
          id
          users(active: true) {
            __typename
            id
            name
            active
            currentDashboard { id }
          }
        }
      }
    `);

    const getUserQuery = query(`
      query getUser($id: ID!) {
        user(id: $id) {
          __typename
          id
          name
          active
          currentDashboard { id }
        }
      }
    `);
    const fooQuery = query(`{ foo }`);

    const entityUpdaters: CacheContext.EntityUpdaters = {
      User(dataProxy, user, previous) {
        const nextActive = user && user.active;
        const prevActive = previous && previous.active;
        if (nextActive === prevActive) return;

        const dashboardId = user ? user.currentDashboard.id : previous.currentDashboard.id;
        const userId = user ? user.id : previous.id;

        dataProxy.updateListOfReferences(
          dashboardId,
          ['users'],
          {
            writeFragment: gql(`
              fragment dashboard on Dashboard {
                id
                users(active: $active) {
                  id
                }
              }
            `),
          },
          {
            readFragment: gql(`
              fragment dashboard on Dashboard {
                id
                users(active: $active) {
                  __typename
                  id
                  name
                  active
                  currentDashboard { id }
                }
              }
            `),
          },
          (previousUsers: any[], fieldArgs) => {
            if (!previousUsers) {
              return previousUsers;
            }
            if (!nextActive) {
              // Remove users once they're no longer active.
              return previousUsers.filter((activeUser: any) => activeUser.id !== userId);
            } else if (previousUsers.findIndex((u: any) => u.id === userId) === -1) {
              // Insert newly active users if they're not already in the list.
              return [...previousUsers, user];
            } else {
              return previousUsers; // No change.
            }
          }
        );
      },

      Query() {},
    };

    const userUpdater = jest.spyOn(entityUpdaters, 'User');
    const rootUpdater = jest.spyOn(entityUpdaters, 'Query');

    let cache: Cache;
    beforeEach(() => {
      cache = new Cache({ ...strictConfig, entityUpdaters });
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

    it(`triggers updaters when an entity is first seen`, () => {
      cache.write(
        { ...getUserQuery, variables: { id: 3 } },
        {
          user: {
            __typename: 'User',
            id: 3,
            name: 'Cheddar',
            active: true,
            currentDashboard: { id: 'dash0' },
          },
        }
      );

      expect(userUpdater.mock.calls.length).to.eq(1);
      const [, user, previous] = userUpdater.mock.calls[0];
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

    it(`triggers updaters when an entity is orphaned`, () => {
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
      const [, user, previous] = userUpdater.mock.calls[0];
      expect(user).to.eq(undefined);
      expect(previous).to.deep.eq(
        {
          __typename: 'User',
          id: 1,
          name: 'Gouda',
          active: true,
          currentDashboard: {
            id: 'dash0',
            name: 'Main Dashboard',
          },
        }
      );
    });

    it(`respects writes by updaters`, () => {
      cache.write({ ...getUserQuery, variables: { id: 2 } }, {
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

    it(`triggers updates to the root node via the Query type`, () => {
      cache.write(fooQuery, { foo: 123 });
      expect(rootUpdater.mock.calls.length).to.eq(1);
      const [, root, previous] = rootUpdater.mock.calls[0];
      expect(root.foo).to.eq(123);
      expect(previous.foo).to.eq(undefined);
    });

  });
});
