import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
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

  describe(`alias and non-alias on references, write alias first`, () => {

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
        fullUserInfo: {
          id: 0,
          FirstName: 'Foo',
          contact: '555-555-5555',
        },
        user: {
          id: 0,
          name: 'Foo',
        },
      }).snapshot;
    });

    it(`only writes fields from the schema`, () => {
      expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
        user: {
          id: 0,
          name: 'Foo',
          phone: '555-555-5555',
        },
      });
    });

    it(`checks shape of GraphNodeSnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          {
            user: {
              id: 0,
              name: 'Foo',
              phone: '555-555-5555',
            },
          },
          /* inbound */ undefined,
          /* outbound */ [{ id: '0', path: ['user'] }],
        )
      );
    });

  });
});
