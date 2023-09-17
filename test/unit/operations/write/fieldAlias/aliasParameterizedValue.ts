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

  describe(`alias parameterized field`, () => {

    let parameterizedId: string, snapshot: GraphSnapshot;
    beforeAll(() => {
      const aliasQuery = query(`{
        superUser: user(id: 4) {
          ID: id
          FirstName: name
        }
      }`);

      snapshot = write(context, empty, aliasQuery, {
        superUser: {
          ID: 0,
          FirstName: 'Baz',
        },
      }).snapshot;

      parameterizedId = '0';
    });

    it(`only writes fields from the schema on simple query`, () => {
      jestExpect(snapshot.getNodeData(parameterizedId)).toEqual({
        id: 0,
        name: 'Baz',
      });
    });

    it(`checks shape of GraphSnapShot at root query`, () => {
      jestExpect(snapshot.getNodeSnapshot(QueryRootId)).toEqual(
        new EntitySnapshot(
          /* data */ undefined,
          /* inbound */ undefined,
          [{ id: 'ROOT_QUERY❖["user"]❖{"id":4}', path: ['user'] }],
        )
      );
    });

    it(`checks shape of GraphSnapShot at parameterized root query`, () => {
      jestExpect(snapshot.getNodeSnapshot(parameterizedId)).toEqual(
        new EntitySnapshot(
          {
            id: 0,
            name: 'Baz',
          },
          [{ 'id': 'ROOT_QUERY❖["user"]❖{"id":4}', path: [] }],
          /* outbound */ undefined,
        )
      );
    });

  });
});
