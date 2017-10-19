import { extract } from '../../../../../src/operations/extract';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`nested parameterized value`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: {
              bee: 'BEEZ',
              three: {
                name: 'ThreeName',
                extraValue: 42,
              },
            },
          },
        },
        `query getAFoo($id: ID!) {
          one {
            two {
              bee
              three(id: $id, withExtra: true) {
                name extraValue
              }
            }
          }
        }`,
        { id: 1 }
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extracts JSON serialization object`, () => {
      const parameterizedId = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two', 'three'],
        { id: 1, withExtra: true }
      );

      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          data: {
            one: {
              two: {
                bee: 'BEEZ',
              },
            },
          },
        },
        [parameterizedId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          data: {
            name: 'ThreeName',
            extraValue: 42,
          },
        },
      });
    });

  });
});
