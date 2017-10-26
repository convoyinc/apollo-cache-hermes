import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';
const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`2d array of values hanging off of a root`, () => {

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      originalGraphSnapshot = createGraphSnapshot(
        {
          rows: [
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
        `{
          rows {
            id
            value
          }
        }`,
        cacheContext
      );

      restoreGraphSnapshot = restore({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: 'a', path: ['rows', 0, 0] },
            { id: 'b', path: ['rows', 0, 1] },
            { id: 'c', path: ['rows', 1, 0] },
            { id: 'd', path: ['rows', 1, 1] },
          ],
          data: {
            rows: [
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
        },
        'a': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['rows', 0, 0] }],
          data: { id: 'a', value: 1 },
        },
        'b': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['rows', 0, 1] }],
          data: { id: 'b', value: 2 },
        },
        'c': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['rows', 1, 0] }],
          data: { id: 'c', value: 3 },
        },
        'd': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['rows', 1, 1] }],
          data: { id: 'd', value: 4 },
        },
      }, cacheContext);
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
    });

  });
});
