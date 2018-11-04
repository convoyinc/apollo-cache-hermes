import { CacheContext } from '../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { extract, prune } from '../../../../src/operations';
import { Serializable, StaticNodeId } from '../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext, query } from '../../../helpers';
const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.prune`, () => {
  let cacheContext: CacheContext;
  let snapshot: GraphSnapshot;
  beforeAll(() => {
    cacheContext = createStrictCacheContext();
    snapshot = createGraphSnapshot(
      {
        rows: {
          elements: [
            [
              { id: 'a', value: 1 },
              { id: 'b', value: 2 },
            ],
            [
              { id: 'c', value: 3 },
              { id: 'd', value: 4 },
              null,
            ],
            null,
          ],
        },
      },
      `query getTable($tableName: String!) {
        rows {
          elements(table: $tableName) {
            id
            value
          }
        }
      }`,
      cacheContext,
      { tableName: 'This is table name' },
    );
  });

  it(`returns empty result if value for the parameterized variable is unknown`, () => {
    const pruneQuery = query(
      `query getTable($tableName: String!) {
        rows {
          elements(table: $tableName) {
            id
            value
          }
        }
      }`, { tableName: 'Something else' }
    );
    const pruned = prune(cacheContext, snapshot, pruneQuery);
    jestExpect(pruned.complete).toBeFalsy();

    const extractResult = extract(pruned.snapshot, cacheContext);
    jestExpect(extractResult).toEqual({
      [QueryRootId]: {
        data: { rows: null },
        type: Serializable.NodeSnapshotType.EntitySnapshot,
      },
    });
  });

});
