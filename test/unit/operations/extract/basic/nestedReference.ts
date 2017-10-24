import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createOriginalGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`nested references hanging off of a root`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createOriginalGraphSnapshot(
        {
          one: {
            two: {
              three: { id: 0 },
            },
          },
        },
        `{ 
            one {
              two {
                three { id }
              }
            }
        }`,
      );

      extractResult = extract(snapshot, createStrictCacheContext());
    });

    it(`extracts JSON serialization object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: '0', path: ['one', 'two', 'three'] }],
          data: {
            one: {
              two: {
                three: undefined,
              },
            },
          },
        },
        '0': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          data: { id: 0 },
        },
      });
    });

  });
});
