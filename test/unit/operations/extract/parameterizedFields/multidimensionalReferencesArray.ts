import { extract } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';
const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`2d array of parameterized references`, () => {

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

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serialization object`, () => {
      const parameterizedId = nodeIdForParameterizedValue(
        QueryRootId,
        ['rows', 'elements'],
        { table: 'This is table name' },
      );

      jestExpect(extractResult).toEqual({
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
          data: { id: 'a', value: 1 },
        },
        'b': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId, path: [0, 1] }],
          data: { id: 'b', value: 2 },
        },
        'c': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId, path: [1, 0] }],
          data: { id: 'c', value: 3 },
        },
        'd': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId, path: [1, 1] }],
          data: { id: 'd', value: 4 },
        },
      });
    });

  });
});
