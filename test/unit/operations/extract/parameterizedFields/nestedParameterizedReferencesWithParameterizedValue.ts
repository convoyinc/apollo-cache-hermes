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

    it(`extract Json serialization object`, () => {
      const parameterizedContainersId = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two'],
        { id: 1 }
      );
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          inbound: null,
          outbound: [{ id: parameterizedContainersId, path: ['one', 'two'] }],
          data: null,
        },
        [parameterizedContainersId]: {
          inbound: [{ id: QueryRootId, path: [] }],
          outbound: [{ id: 31, path: ['three'] }],
          data: null,
        },
        '31': {
          inbound: [{ id: parameterizedContainersId, path: ['three'] }],
          outbound: null,
          data: {
            id: 31,
            four: { five: 1 },
          },
        },
      });
    });

  });
});
