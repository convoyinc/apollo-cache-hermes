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
          two: {
            three: { id: 0 },
            four: { id: 1 },
          },
        },
      },
      `{ 
          one {
            two {
              three { id }
              four { id }
            }
          }
      }`,
      cacheContext
    );

    const pruneQuery = query(`{ 
      one {
        two {
          four { id }
        }
      }
    }`);
    const pruned = prune(cacheContext, snapshot, pruneQuery);
    extractResult = extract(pruned.snapshot, cacheContext);
  });

  it(`prunes fields from entities in cache with nested references and peer reference correctly`, () => {
    jestExpect(extractResult).toEqual({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        outbound: [
          { id: '1', path: ['one', 'two', 'four'] },
        ],
        data: {
          one: {
            two: {
              four: undefined,
            },
          },
        },
      },
      '1': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: QueryRootId, path: ['one', 'two', 'four'] }],
        data: { id: 1 },
      },
    });
  });

});
