import { extract, prune } from '../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { Serializable, StaticNodeId } from '../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext, query } from '../../../helpers';
const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.prune`, () => {
  let extractResult: Serializable.GraphSnapshot;
  beforeAll(() => {
    const cacheContext = createStrictCacheContext();
    const snapshot = createGraphSnapshot(
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

    const pruneQuery = query(
      `query getTable($tableName: String!) {
        rows {
          elements(table: $tableName) {
            id
          }
        }
      }`, { tableName: 'This is table name' }
    );
    const pruned = prune(cacheContext, snapshot, pruneQuery);
    extractResult = extract(pruned.snapshot, cacheContext);
  });

  it(`prunes fields from parameterized 2d reference array correctly`, () => {
    const parameterizedId = nodeIdForParameterizedValue(
      QueryRootId,
      ['rows', 'elements'],
      { table: 'This is table name' },
    );

    expect(extractResult).toEqual({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        outbound: [{ id: parameterizedId, path: ['rows', 'elements'] }],
      },
      [parameterizedId]: {
        type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
        inbound: [{ id: QueryRootId, path: ['rows', 'elements'] }],
        outbound: [
          { id: 'a', path: [0, 0] },
          { id: 'b', path: [0, 1] },
          { id: 'c', path: [1, 0] },
          { id: 'd', path: [1, 1] },
        ],
        data: [
          [
            undefined,
            undefined,
          ],
          [
            undefined,
            undefined,
            null,
          ],
          null,
        ],
      },
      'a': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: parameterizedId, path: [0, 0] }],
        data: { id: 'a' },
      },
      'b': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: parameterizedId, path: [0, 1] }],
        data: { id: 'b' },
      },
      'c': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: parameterizedId, path: [1, 0] }],
        data: { id: 'c' },
      },
      'd': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: parameterizedId, path: [1, 1] }],
        data: { id: 'd' },
      },
    });
  });

});
