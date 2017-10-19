import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { extract, restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`top-level parameterized reference`, () => {

    const parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1 });
    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          foo: {
            id: 1,
            name: 'Foo',
            extra: false,
          },
        },
        `query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            id name extra
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
      const parameterizedNode = restoreResult.getNodeSnapshot(parameterizedId)!;
      const entityData = restoreResult.getNodeData('1');

      expect(parameterizedNode.inbound).to.have.members([{ id: QueryRootId, path: ['foo'] }]);
      expect(parameterizedNode.outbound).to.have.members([{ id: '1', path: [] }]);
      expect(parameterizedNode.data).to.eq(entityData);
    });

    it(`restores id=1 NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          {
            id: 1,
            name: 'Foo',
            extra: false,
          },
          [{ id: parameterizedId, path: ['foo'] }],
          /* outbound */ undefined
        )
      );
    });

  });
});
