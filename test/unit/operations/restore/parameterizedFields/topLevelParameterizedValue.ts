import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`top-level parameterized value`, () => {

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
            name: 'Foo',
            extra: false,
          },
        },
        `query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            name extra
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
          data: {
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

  });
});
