import { extract } from '../../../../../src/operations/extract';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createParameterizedOriginalGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`nested parameterized value`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createParameterizedOriginalGraphSnapshot(
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
      );

      extractResult = extract(snapshot, createStrictCacheContext());
    });

    it(`extracts JSON serialization object`, () => {
      const parameterizedId0 = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two', 0, 'three'],
        { id: 1, withExtra: true }
      );
      const parameterizedId1 = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two', 1, 'three'],
        { id: 1, withExtra: true }
      );

      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: parameterizedId0, path: ['one', 'two', 0, 'three'] },
            { id: parameterizedId1, path: ['one', 'two', 1, 'three'] },
          ],
          data: {
            one: {
              two: [undefined, undefined],
            },
          },
        },
        [parameterizedId0]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
          data: {
            name: 'Three0',
            extra: false,
          },
        },
        [parameterizedId1]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
          data: {
            name: 'Three1',
            extra: true,
          },
        },
      });
    });

  });
});
