import { extract } from '../../../../../src/operations/extract';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`nested references in an array hanging off of a root`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
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
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extracts JSON serialization object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: 0, path: ['one', 'two', 'three'] }],
          data: {
            one: {
              two: {},
            },
          },
        },
        '0': {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          data: { id: 0 },
        },
      });
    });

  });
});
