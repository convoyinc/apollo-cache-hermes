import { extract } from '../../../../../src/operations/extract';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createParameterizedOriginalGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`top-level parameterized value`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createParameterizedOriginalGraphSnapshot(
        {
          foo: {
            name: 'Foo',
            extra: false,
          },
        },
        `query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            name extra
          }
        }`,
        { id: 1 }
      );

      extractResult = extract(snapshot, createStrictCacheContext());
    });

    it(`extracts JSON serialization object`, () => {
      const parameterizedId = nodeIdForParameterizedValue(
        QueryRootId,
        ['foo'],
        { id: 1, withExtra: true }
      );

      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: parameterizedId, path: ['foo'] }],
        },
        [parameterizedId]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['foo'] }],
          data: {
            name: 'Foo',
            extra: false,
          },
        },
      });
    });

  });
});
