import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { write } from '../../../../../src/operations/write';
import { RawOperation, StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`nested alias leaf-value`, () => {

    let aliasQuery: RawOperation, snapshot: GraphSnapshot;
    beforeAll(() => {
      aliasQuery = query(`{
        user {
          info {
            FirstName: name
          }
        }
      }`);

      snapshot = write(context, empty, aliasQuery, {
        user: {
          info: {
            FirstName: 'Foo',
          },
        },
      }).snapshot;
    });

    it(`only writes fields from the schema`, () => {
      expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
        user: {
          info: {
            name: 'Foo',
          },
        },
      });
    });

    it(`checks shape of GraphNodeSnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          {
            user: {
              info: {
                name: 'Foo',
              },
            },
          },
          /* inbound */ undefined,
          /* outbound */ undefined,
        )
      );
    });
  });
});
