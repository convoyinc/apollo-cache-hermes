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
            two: [
              {
                three: {
                  name: 'Three0',
                  extra: false,
                },
              },
              {
                three: {
                  name: 'Three1',
                  extra: true,
                },
              },
            ],
          },
        },
        `query getAFoo($id: ID!) {
          one {
            two {
              three (id: $id, withExtra: true) {
                name extra
              }
            }
          }
        }`,
        { id: 1 }
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extract JSON serialization object`, () => {
      const parameterizedId0 = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two', 0, 'three'],
        { id: 1 }
      );
      const parameterizedId1 = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two', 1, 'three'],
        { id: 1 }
      );

      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: parameterizedId0, path: ['one', 'two', 0, 'three'] },
            { id: parameterizedId1, path: ['one', 'two', 1, 'three'] },
          ],
          data: {
            one: {
              two: [],
            },
          },
        },
        [parameterizedId0]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
          data: {
            three: {
              name: 'Three0',
              extra: false,
            },
          },
        },
        [parameterizedId1]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
          data: {
            three: {
              name: 'Three1',
              extra: true,
            },
          },
        },
      });
    });

  });
});
