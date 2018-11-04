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
        one: {
          two: [
            { three: { id: 0, stuff: 'a' } },
            { three: { id: 1, stuff: 'b' } },
          ],
        },
      },
      `{ 
          one {
            two {
              three { id stuff }
            }
          }
      }`,
      cacheContext
    );

    const pruneQuery = query(`{ 
      one {
        two {
          three { id }
        }
      }
    }`);
    const pruned = prune(cacheContext, snapshot, pruneQuery);
    extractResult = extract(pruned.snapshot, cacheContext);
  });

  it(`prunes fields from the entities referenced by nested object in an array correctly`, () => {
    jestExpect(extractResult).toEqual({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        outbound: [
          { id: '0', path: ['one', 'two', 0, 'three'] },
          { id: '1', path: ['one', 'two', 1, 'three'] },
        ],
        data: {
          one: {
            two: [{ three: undefined }, { three: undefined }],
          },
        },
      },
      '0': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
        data: { id: 0 },
      },
      '1': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
        data: { id: 1 },
      },
    });
  });

});
