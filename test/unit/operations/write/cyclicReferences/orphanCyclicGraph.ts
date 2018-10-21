import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { NodeId, StaticNodeId } from '../../../../../src/schema';
import { createSnapshot, updateSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`edit cyclic graph`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const cyclicRefQuery = `{
        foo {
          id
          name
          bar {
            id
            name
            fizz { id }
            buzz { id }
          }
        }
      }`;

      const baseline = createSnapshot(
        {
          foo: {
            id: 1,
            name: 'Foo',
            bar: {
              id: 2,
              name: 'Bar',
              fizz: { id: 1 },
              buzz: { id: 2 },
            },
          },
        },
        cyclicRefQuery
      ).snapshot;

      const result = updateSnapshot(
        baseline,
        { foo: null },
        cyclicRefQuery
      );

      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`removes the reference to the subgraph`, () => {
      expect(snapshot.getNodeData(QueryRootId).foo).toEqual(null);
    });

    // TODO: Detect this case, and actually make it work.  Mark & sweep? :(
    it.skip(`garbage collects the orphaned subgraph`, () => {
      expect(snapshot.allNodeIds()).toEqual([QueryRootId]);
    });

    it.skip(`marks all nodes as edited`, () => {
      expect(Array.from(editedNodeIds).sort()).toEqual([QueryRootId, '1', '2'].sort());
    });
  });
});
