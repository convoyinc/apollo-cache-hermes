import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`simple leaf-values hanging off a root`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      const result = createSnapshot(
        {
          rows: [
            [
              { value: 1 },
              { value: 2 },
            ],
            [
              { value: 3 },
              { value: 4 },
            ],
          ],
        },
        `{
          rows {
            value
          }
        }`
      );
      snapshot = result.snapshot;
    });

    it(`creates the query root, with the values`, () => {
      expect(snapshot.getNodeData(QueryRootId)).toEqual({
        rows: [
          [
            { value: 1 },
            { value: 2 },
          ],
          [
            { value: 3 },
            { value: 4 },
          ],
        ],
      });
    });

  });

});
