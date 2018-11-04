import { extract } from '../../../../../src/operations/extract';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`nested parameterized references with parameterized value`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
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
        cacheContext,
        { id: 1 }
      );

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serialization object`, () => {
      const parameterizedId = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two'],
        { id: 1 }
      );

      const nestedParameterizedId = nodeIdForParameterizedValue(
        '31',
        ['four'],
        { extra: true }
      );

      jestExpect(extractResult).toEqual({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: parameterizedId, path: ['one', 'two'] }],
        },
        [parameterizedId]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two'] }],
          outbound: [{ id: '31', path: ['three'] }],
          data: {
            three: undefined,
          },
        },
        '31': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId, path: ['three'] }],
          outbound: [{ id: nestedParameterizedId, path: ['four'] }],
          data: {
            id: 31,
          },
        },
        [nestedParameterizedId]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: '31', path: ['four'] }],
          data: {
            five: 1,
          },
        },
      });
    });

  });
});
