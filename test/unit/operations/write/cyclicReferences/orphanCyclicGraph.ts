import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { NodeId, StaticNodeId } from '../../../../../src/schema';
import { createBaselineEditedSnapshot, createUpdateEditedSnapshot, WriteTestQuery } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`edit cyclic graph`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baseline = createBaselineEditedSnapshot(
        WriteTestQuery.cyclicRefQuery,
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
        }
      ).snapshot;

      const result = createUpdateEditedSnapshot(
        baseline,
        WriteTestQuery.cyclicRefQuery,
        { foo: null }
      );

      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`removes the reference to the subgraph`, () => {
      expect(snapshot.getNodeData(QueryRootId).foo).to.eq(null);
    });

    // TODO: Detect this case, and actually make it work.  Mark & sweep? :(
    it.skip(`garbage collects the orphaned subgraph`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
    });

    it.skip(`marks all nodes as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1', '2']);
    });
  });
});
