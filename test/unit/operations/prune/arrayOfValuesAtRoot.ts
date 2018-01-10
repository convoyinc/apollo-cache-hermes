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

  it(`prunes fields from entities in an array at the root correctly`, () => {
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
