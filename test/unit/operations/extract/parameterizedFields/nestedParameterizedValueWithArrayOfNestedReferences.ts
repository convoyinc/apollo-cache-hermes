import { extract } from '../../../../../src/operations/extract';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`nested parameterized value with array of nested references`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
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
              null,
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
        cacheContext,
        { id: 1 }
      );

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serialization object`, () => {
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

      expect(extractResult).toEqual({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: parameterizedTopContainerId, path: ['one', 'two'] }],
        },
        [parameterizedTopContainerId]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two'] }],
          outbound: [
            { id: '31', path: [0, 'three'] },
            { id: '32', path: [1, 'three'] },
          ],
          data: [{ three: undefined }, { three: undefined }, null],
        },
        '31': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedTopContainerId, path: [0, 'three'] }],
          outbound: [{ id: nestedParameterizedValueId0, path: ['four'] }],
          data: {
            id: 31,
          },
        },
        [nestedParameterizedValueId0]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: '31', path: ['four'] }],
          data: {
            five: 1,
          },
        },
        '32': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedTopContainerId, path: [1, 'three'] }],
          outbound: [{ id: nestedParameterizedValueId1, path: ['four'] }],
          data: {
            id: 32,
          },
        },
        [nestedParameterizedValueId1]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: '32', path: ['four'] }],
          data: {
            five: 1,
          },
        },
      });
    });

  });
});
