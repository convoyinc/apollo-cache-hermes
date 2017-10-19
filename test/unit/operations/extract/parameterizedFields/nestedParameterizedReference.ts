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
              three: {
                id: '31',
                name: 'Three',
                extraValue: 42,
              },
            },
          },
        },
        `query getAFoo($id: ID!) {
          one {
            two {
              three(id: $id, withExtra: true) {
                id name extraValue
              }
            }
          }
        }`,
        { id: 1 }
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extract Json serialization object`, () => {
      const parameterizedId = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two', 'three'],
        { id: 1, withExtra: true }
      );

      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: parameterizedId, path: ['one', 'two', 'three'] }],
        },
        [parameterizedId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          outbound: [{ id: '31', path: [] }],
        },
        'baz0': {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId, path: [] }],
          data: {
            id: '31',
            name: 'Three',
            extraValue: 42,
          },
        },
      });
    });

  });
});
