import { extract } from '../../../../../src/operations/extract';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`nested parameterized value with an array of nested values`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: [
              {
                three: {
                  threeValue: 'first',
                },
              },
              {
                three: {
                  threeValue: 'second',
                },
              },
            ],
          },
        },
        `query nested($id: ID!) {
          one {
            two(id: $id) {
              three {
                threeValue
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
          outbound: null,
          data: {
            three: {
              threeValue: 'first',
            },
          },
        },
        [parameterizedTopContainerId1]: {
          inbound: [{ id: QueryRootId, path: ['one', 'two', 1] }],
          outbound: null,
          data: {
            three: {
              threeValue: 'second',
            },
          },
        },
      });
    });

  });
});
