import { extract, prune } from '../../../../src/operations';
import { Serializable, StaticNodeId } from '../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext, query } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.prune`, () => {
  let extractResult: Serializable.GraphSnapshot;
  beforeAll(() => {
    const cacheContext = createStrictCacheContext();
    const snapshot = createGraphSnapshot(
      {
        rows: [
          [
            { value: 1, extra: 'wind' },
            { value: 2, extra: 'air' },
          ],
          [
            { value: 3, extra: 'fire' },
            { value: 4, extra: 'earth' },
          ],
        ],
      },
      `{ 
        rows {
          value
          extra
        }
      }`,
      cacheContext
    );

    const pruneQuery = query(`{ rows { value }}`);
    const pruned = prune(cacheContext, snapshot, pruneQuery);
    extractResult = extract(pruned.snapshot, cacheContext);
  });

  it(`is able to prune fields from entities in a 2d array correctly`, () => {
    jestExpect(extractResult).toEqual({
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
