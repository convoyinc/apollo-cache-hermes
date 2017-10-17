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
      const parameterizedTopContainerId0 = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two', 0],
        { id: 0 }
      );
      const parameterizedTopContainerId1 = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two', 1],
        { id: 1 }
      );

      const nestedParameterizedValueId0 = nodeIdForParameterizedValue(
        '31',
        ['one', 'two', 0, 'three', 'four'],
        { extra: true  }
      );
      const nestedParameterizedValueId1 = nodeIdForParameterizedValue(
        '32',
        ['one', 'two', 1, 'three', 'four'],
        { extra: true }
      );

      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          inbound: null,
          outbound: [
            { id: parameterizedTopContainerId0, path: ['one', 'two', 0] },
            { id: parameterizedTopContainerId1, path: ['one', 'two', 1] },
          ],
          data: {
            one: {
              two: [],
            },
          },
        },
        [parameterizedTopContainerId0]: {
          inbound: [{ id: QueryRootId, path: ['one', 'two', 0] }],
          outbound: [{ id: 31, path: [31, 'three'] }],
          data: {
            three: null,
          },
        },
        '31': {
          inbound: [{ id: parameterizedTopContainerId0, path: [31, 'three'] }],
          outbound: [{ id: nestedParameterizedValueId0, path: ['four'] }],
          data: {
            id: 31,
          },
        },
        [nestedParameterizedValueId0]: {
          inbound: [{ id: '31', path: ['four'] }],
          outbound: null,
          data: {
            five: 1,
          },
        },
        [parameterizedTopContainerId1]: {
          inbound: [{ id: QueryRootId, path: ['one', 'two', 1] }],
          outbound: [{ id: 32, path: [32, 'three'] }],
          data: {
            three: null,
          },
        },
        '32': {
          inbound: [{ id: parameterizedTopContainerId1, path: [32, 'three'] }],
          outbound: [{ id: nestedParameterizedValueId1, path: ['four'] }],
          data: {
            id: 31,
          },
        },
        [nestedParameterizedValueId1]: {
          inbound: [{ id: '32', path: ['four'] }],
          outbound: null,
          data: {
            five: 1,
          },
        },
      });
    });

  });
});
