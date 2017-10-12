import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
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

  describe(`complex query with alias parameterized references`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      const aliasQuery = query(`{
        fullUser: user(id: 4) {
          id
          FirstName: name
          contact: contactInfo {
            shortAddress: address {
              city
              state
            }
            phone
          }
        }
        shortUser: user (id: 4) {
          id
          FirstName: name
          contact: contactInfo {
            phone
          }
        }
        user (id: 4) {
          id
          name
        }
      }`);

      snapshot = write(context, empty, aliasQuery, {
        fullUser: {
          id: 4,
          FirstName: 'Foo',
          contact: {
            shortAddress: {
              city: 'ABA',
              state: 'AA',
            },
            phone: '555-555-5555',
          },
        },
        shortUser: {
          id: 4,
          FirstName: 'Foo',
          contact: {
            phone: '555-555-5555',
          },
        },
        user: {
          id: 4,
          name: 'Foo',
        },
      }).snapshot;
    });

    it(`only writes fields from the schema`, () => {
      const parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['user'], { id: 4 });
      expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({
        id: 4,
        name: 'Foo',
        contactInfo: {
          address: {
            city: 'ABA',
            state: 'AA',
          },
          phone: '555-555-5555',
        },
      });
    });

  });
});
