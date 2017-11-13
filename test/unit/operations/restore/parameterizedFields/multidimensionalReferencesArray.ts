import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';
const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`2d array of parameterized references`, () => {

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      originalGraphSnapshot = createGraphSnapshot(
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

      const parameterizedId = nodeIdForParameterizedValue(
        QueryRootId,
        ['rows', 'elements'],
        { table: 'This is table name' },
      );

      restoreGraphSnapshot = restore({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: parameterizedId, path: ['rows', 'elements'] }],
          data: undefined,
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
              null,
              null,
            ],
            [
              null,
              null,
              null,
            ],
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
      }, cacheContext).cacheSnapshot.baseline;
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
    });

  });
});
