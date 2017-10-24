import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createOriginalGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`nested references in an array`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createOriginalGraphSnapshot(
        {
          one: {
            two: [
              { three: { id: 0 } },
              { three: { id: 1 } },
            ],
          },
        },
        `{ 
            one {
              two {
                three { id }
              }
            }
        }`,
        cacheContext
      );

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serialization object`, () => {
      expect(extractResult).to.deep.eq({
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
});
