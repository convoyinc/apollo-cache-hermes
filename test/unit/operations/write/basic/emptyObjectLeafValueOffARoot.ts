import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { NodeId, StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`an empty object leaf-value`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const result = createSnapshot(
        {
          foo: {},
          bar: [],
        },
        `{ foo bar }`
      );
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`stores the values`, () => {
      jestExpect(snapshot.getNodeData(QueryRootId)).toEqual({
        foo: {},
        bar: [],
      });
    });

    it(`marks the container as edited`, () => {
      jestExpect(Array.from(editedNodeIds)).toEqual([QueryRootId]);
    });

  });
});
