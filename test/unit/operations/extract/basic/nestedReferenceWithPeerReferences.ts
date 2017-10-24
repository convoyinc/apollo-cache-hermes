import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`nested references hanging off of a root`, () => {

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

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serialization object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: '0', path: ['one', 'two', 'three'] },
            { id: '1', path: ['one', 'two', 'four'] },
          ],
          data: {
            one: {
              two: {
                three: undefined,
                four: undefined,
              },
            },
          },
        },
        '0': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          data: { id: 0 },
        },
        '1': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 'four'] }],
          data: { id: 1 },
        },
      });
    });

  });
});
