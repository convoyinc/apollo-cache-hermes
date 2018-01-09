import { extract, prune } from '../../../../src/operations';
import { Serializable, StaticNodeId } from '../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext, query } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.prune`, () => {
  describe(`array of values at the root`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
        {
          viewer: [
            {
              postal: 123,
              name: 'Gouda',
            },
            {
              postal: 456,
              name: 'Brie',
            },
          ],
        },
        `{ viewer { postal name } }`,
        cacheContext
      );

      const pruneQuery = query(`{ viewer { name }}`);
      const pruned = prune(cacheContext, snapshot, pruneQuery);
      extractResult = extract(pruned.snapshot, cacheContext);
    });

    it(`is pruned accroding to prune query`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          data: {
            viewer: [
              { name: 'Gouda' },
              { name: 'Brie' },
            ],
          },
        },
      });
    });

  });
});
