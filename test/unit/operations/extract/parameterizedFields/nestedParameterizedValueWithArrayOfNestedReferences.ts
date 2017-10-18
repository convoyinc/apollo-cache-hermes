import { extract } from '../../../../../src/operations/extract';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`nested parameterized value with array of nested references`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: [
              {
                three: {
                  id: 31,
                  four: { five: 1 },
                },
              },
              {
                three: {
                  id: 32,
                  four: { five: 1 },
                },
              },
            ],
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

    it(`extract Json serialization object`, () => {
      const parameterizedTopContainerId = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two'],
        { id: 1 }
      );

      const nestedParameterizedValueId0 = nodeIdForParameterizedValue(
        '31',
        ['four'],
        { extra: true },
      );

      const nestedParameterizedValueId1 = nodeIdForParameterizedValue(
        '32',
        ['four'],
        { extra: true },
      );

      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: parameterizedTopContainerId, path: ['one', 'two'] }],
        },
        [parameterizedTopContainerId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two'] }],
          outbound: [
            { id: 31, path: ['0', 'three'] },
            { id: 32, path: ['1', 'three'] },
          ],
          isParameterizedValueSnapshot: true,
          data: [
            { three: {} },
            { three: {} },
          ],
        },
        '31': {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedTopContainerId, path: ['0', 'three'] }],
          outbound: [{ id: nestedParameterizedValueId0, path: ['four'] }],
          data: {
            id: 31,
          },
        },
        [nestedParameterizedValueId0]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: '31', path: ['four'] }],
          isParameterizedValueSnapshot: true,
          data: {
            five: 1,
          },
        },
        '32': {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedTopContainerId, path: ['1', 'three'] }],
          outbound: [{ id: nestedParameterizedValueId1, path: ['four'] }],
          data: {
            id: 32,
          },
        },
        [nestedParameterizedValueId1]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: '32', path: ['four'] }],
          data: {
            five: 1,
          },
        },
      });
    });

  });
});
