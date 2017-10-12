import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { write } from '../../../../../src/operations/write';
import { StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`complex nested query with alias values`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      const nestedAliasQuery = query(`
        query GetUser {
          fullUserInfo: user {
            userId: id
            nickName
            FirstName: name
            contact {
              address: homeAddress {
                city
                state
              }
              phone
            }
          }
        }
      `);

      snapshot = write(context, empty, nestedAliasQuery, {
        fullUserInfo: {
          userId: 0,
          nickName: 'Foo Foo',
          FirstName: 'Foo',
          contact: {
            address: {
              city: 'Seattle',
              state: 'WA',
            },
            phone: '555-555-5555',
          },
        },
      }).snapshot;
    });

    it(`only writes fields from the schema`, () => {
      expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
        user: {
          id: 0,
          name: 'Foo',
          nickName: 'Foo Foo',
          contact: {
            homeAddress: {
              city: 'Seattle',
              state: 'WA',
            },
            phone: '555-555-5555',
          },
        },
      });
    });

  });
});
