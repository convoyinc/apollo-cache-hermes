import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
import { ParameterizedValueSnapshot } from '../../../../../src/nodes/ParameterizedValueSnapshot';
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

  describe(`alias parameterized references`, () => {

    let parameterizedId: string, snapshot: GraphSnapshot;

    beforeAll(() => {
      const aliasQuery = query(`
        query getUser($id: ID!) {
          superUser: user(id: $id) {
            id
            FirstName: name
          }
        }
      `, { id: 4 });

      snapshot = write(context, empty, aliasQuery, {
        superUser: {
          id: 4,
          FirstName: 'Baz',
        },
      }).snapshot;
      parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['user'], { id: 4 });
    });

    it(`only writes fields from the schema on simple query with variables`, () => {
      expect(snapshot.getNodeData(parameterizedId)).toEqual({
        id: 4,
        name: 'Baz',
      });
    });

    it(`checks shape of GraphSnapShot at root query`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).toEqual(
        new EntitySnapshot(
          /* data */ undefined,
          /* inbound */ undefined,
          [{ id: 'ROOT_QUERY❖["user"]❖{"id":4}', path: ['user'] }],
        )
      );
    });

    it(`checks shape of GraphSnapShot at parameterized root query`, () => {
      expect(snapshot.getNodeSnapshot(parameterizedId)).toEqual(
        new ParameterizedValueSnapshot(
          {
            id: 4,
            name: 'Baz',
          },
          [{ id: 'ROOT_QUERY', path: ['user'] }],
          [{ id: '4', path: [] }],
        )
      );
    });

    it(`checks shape of GraphSnapShot at the reference`, () => {
      expect(snapshot.getNodeSnapshot('4')).toEqual(
        new EntitySnapshot(
          {
            id: 4,
            name: 'Baz',
          },
          [{ id: 'ROOT_QUERY❖["user"]❖{"id":4}', path: [] }],
          /* outbound */ undefined,
        )
      );
    });

  });
});
