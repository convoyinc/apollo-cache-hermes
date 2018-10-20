import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`2d array of references hanging off of a root`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
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

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serializable object`, () => {
      jestExpect(extractResult).toEqual({
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
                undefined,
                undefined,
              ],
              [
                undefined,
                undefined,
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

      });
    });

  });
});
