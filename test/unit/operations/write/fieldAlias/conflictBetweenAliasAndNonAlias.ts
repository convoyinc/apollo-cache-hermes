import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
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

  describe(`conflict between alias and non-alias, ordered based on selection sets`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      const mixQuery = query(`
        query GetUser {
          fullUserInfo: user {
            id
            FirstName: name
            contact: phone
          }
          user {
            id
            name
          }
        }
      `);
      snapshot = write(context, empty, mixQuery, {
        user: {
          id: 1,
          name: 'Foo',
        },
        fullUserInfo: {
          id: 1,
          FirstName: 'FooBar',
          contact: '555-555-5555',
        },
      }).snapshot;
    });

    it(`only writes fields with the schema`, () => {
      expect(snapshot.getNodeData(QueryRootId)).toEqual({
        user: {
          id: 1,
          name: 'Foo',
          phone: '555-555-5555',
        },
      });
    });

    it(`checks shape of GraphNodeSnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).toEqual(
        new EntitySnapshot(
          {
            user: {
              id: 1,
              name: 'Foo',
              phone: '555-555-5555',
            },
          },
          /* inbound */ undefined,
          /* outbound */ [{ id: '1', path: ['user'] }],
        )
      );
    });

  });
});
