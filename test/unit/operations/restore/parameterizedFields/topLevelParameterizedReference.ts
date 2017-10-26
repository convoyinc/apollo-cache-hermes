import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { ParameterizedValueSnapshot, EntitySnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`top-level parameterized reference`, () => {

    const parameterizedId = nodeIdForParameterizedValue(
      QueryRootId,
      ['foo'],
      { id: 1, withExtra: true }
    );
    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      originalGraphSnapshot = createGraphSnapshot(
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
        cacheContext,
        { id: 1 }
      );

      restoreGraphSnapshot = restore({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: parameterizedId, path: ['foo'] }],
        },
        [parameterizedId]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['foo'] }],
          outbound: [{ id: '1', path: [] }],
          data: null,
        },
        '1': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId, path: [] }],
          data: {
            id: 1,
            name: 'Foo',
            extra: false,
          },
        },
      }, cacheContext);
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceof(ParameterizedValueSnapshot);
    });

    it(`restores parameterized RootQuery NodeSnapshot from JSON serialization object`, () => {
      const parameterizedNode = restoreGraphSnapshot.getNodeSnapshot(parameterizedId)!;
      const entityData = restoreGraphSnapshot.getNodeData('1');

      expect(parameterizedNode.inbound).to.have.deep.members([{ id: QueryRootId, path: ['foo'] }]);
      expect(parameterizedNode.outbound).to.have.deep.members([{ id: '1', path: [] }]);
      expect(parameterizedNode.data).to.eq(entityData);
    });

  });
});
