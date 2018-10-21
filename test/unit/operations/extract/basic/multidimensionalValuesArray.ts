import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`2d array of  values hanging off of a root`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
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
        }`,
        cacheContext
      );

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serializable object`, () => {
      expect(extractResult).toEqual({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          data: {
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
        },
      });
    });

  });
});
