import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createOriginalGraphSnapshot, strictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`new array of values hanging off of a root`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createOriginalGraphSnapshot(
        {
          rows: [
            [
              { id: 'a', value: 1 },
              { id: 'b', value: 2 },
            ],
            [
              { id: 'c', value: 3 },
              { id: 'd', value: 4 },
            ],
          ],
        },
        `{ 
          rows {
            id
            value
          }
        }`
      );

      extractResult = extract(snapshot, strictCacheContext);
    });

    it(`extracts JSON serializable object`, () => {
      expect(extractResult).to.deep.eq({
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