import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { write } from '../../../../../src/operations/write';
import { NodeId, RawOperation, StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`nested non-entity parameterized fields with indirect fields contained in an array`, () => {

    let nestedQuery: RawOperation, snapshot: GraphSnapshot, containerId: NodeId;
    beforeAll(() => {
      nestedQuery = query(`query nested($id: ID!) {
        one {
          two(id: $id) {
            three {
              threeValue
            }
          }
        }
      }`, { id: 1 });

      containerId = nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });

      snapshot = write(context, empty, nestedQuery, {
        one: {
          two: [
            {
              three: {
                threeValue: 'first',
              },
            },
            {
              three: {
                threeValue: 'second',
              },
            },
          ],
        },
      }).snapshot;
    });

    it(`no references from the parent`, () => {
      const container = snapshot.getNodeSnapshot(containerId)!;
      expect(container.outbound).to.eq(undefined);
    });

    it(`writes an array with the correct length`, () => {
      // This is a bit arcane, but it ensures that _overlayParameterizedValues
      // behaves properly when iterating arrays that contain _only_
      // parameterized fields.
      expect(snapshot.getNodeData(containerId)).to.deep.eq([
        {
          three: {
            threeValue: 'first',
          },
        },
        {
          three: {
            threeValue: 'second',
          },
        },
      ]);
    });

    it(`allows removal of values containing a field`, () => {
      const updated = write(context, snapshot, nestedQuery, {
        one: {
          two: [
            null,
            {
              three: {
                threeValue: 'second',
              },
            },
          ],
        },
      }).snapshot;

      expect(updated.getNodeData(containerId)).to.deep.eq([
        null,
        {
          three: {
            threeValue: 'second',
          },
        },
      ]);
    });

  });
});
