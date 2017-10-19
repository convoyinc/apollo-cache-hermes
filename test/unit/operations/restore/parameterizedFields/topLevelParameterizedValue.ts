import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { extract, restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`top-level parameterized value`, () => {

    const parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1 });

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
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
      ).snapshot;

      restoreResult = restore(extract(snapshot));
    });

    it(`restores RootQuery NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          /* data */ undefined,
          /* inbound */ undefined,
          [{ id: parameterizedId, path: ['foo'] }],
        )
      );
    });

    it(`restores parameterized RootQuery NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(parameterizedId)).to.deep.eq(
        new ParameterizedValueSnapshot(
          {
            name: 'Foo',
            extra: false,
          },
          [{ id: QueryRootId, path: ['foo'] }],
          /* outbound */ undefined
        )
      );
    });

  });
});
