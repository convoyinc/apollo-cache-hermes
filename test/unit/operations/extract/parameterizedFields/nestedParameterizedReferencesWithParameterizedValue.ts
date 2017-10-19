import { extract } from '../../../../../src/operations/extract';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`nested parameterized references with parameterized value`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: {
              three: {
                id: 31,
                four: { five: 1 },
              },
            },
          },
        },
        `query nested($id: ID!) {
          one {
            two(id: $id) {
              three {
                id
                four(extra: true) {
                  five
                }
              }
            }
          }
        }`,
        { id: 1 }
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extract JSON serialization object`, () => {
      const parameterizedId = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two'],
        { id: 1 }
      );

      const nestedParameterizedId = nodeIdForParameterizedValue(
        QueryRootId,
        ['31', 'four'],
        { extra: true }
      );

      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: parameterizedId, path: ['one', 'two'] }],
        },
        [parameterizedId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: [] }],
          outbound: [{ id: 31, path: ['three'] }],
          data: {},
        },
        '31': {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId, path: ['three'] }],
          outbound: [{ id: nestedParameterizedId, path: ['four'] }],
          data: {
            id: 31,
          },
        },
        [nestedParameterizedId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: parameterizedId, path: ['four'] }],
          data: {
            five: 1,
          },
        },
      });
    });

  });
});
