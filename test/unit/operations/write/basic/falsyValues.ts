import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`falsy values`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      const result = createSnapshot(
        { null: null, false: false, zero: 0, string: '' },
        `{ null, false, zero, string }`
      );

      snapshot = result.snapshot;
    });

    it(`persists all falsy values`, () => {
      jestExpect(snapshot.getNodeData(QueryRootId)).toEqual({ null: null, false: false, zero: 0, string: '' });
    });

  });
});
