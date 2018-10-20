import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { write } from '../../../../../src/operations/write';
import { RawOperation, StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`alias entity-defining field`, () => {
    let aliasQuery: RawOperation, snapshot: GraphSnapshot;
    beforeAll(() => {
      aliasQuery = query(`{
        user {
          userId: id
          FirstName: name
        }
      }`);

      snapshot = write(context, empty, aliasQuery, {
        user: {
          userId: 0,
          FirstName: 'Foo',
        },
      }).snapshot;
    });

    it(`only writes fields from the schema`, () => {
      expect(snapshot.getNodeData(QueryRootId)).toEqual({
        user: {
          id: 0,
          name: 'Foo',
        },
      });
    });

    it(`checks shape of GraphNodeSnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).toEqual(
        new EntitySnapshot(
          {
            user: {
              id: 0,
              name: 'Foo',
            },
          },
          /* inbound */ undefined,
          /* outbound */ undefined,
        )
      );
    });

    it(`checks only one entity node on RootQuery`, () => {
      expect(snapshot.allNodeIds()).toEqual([QueryRootId]);
    });

  });
});
