import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { ParameterizedValueSnapshot, EntitySnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`nested parameterized references with parameterized value`, () => {

    const parameterizedId = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two'],
      { id: 1 }
    );

    const nestedParameterizedId = nodeIdForParameterizedValue(
      '31',
      ['four'],
      { extra: true }
    );

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      originalGraphSnapshot = createGraphSnapshot(
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
        cacheContext,
        { id: 1 }
      );

      restoreGraphSnapshot = restore({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: parameterizedId, path: ['one', 'two'] }],
        },
        [parameterizedId]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two'] }],
          outbound: [{ id: '31', path: ['three'] }],
          data: { },
        },
        '31': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId, path: ['three'] }],
          outbound: [{ id: nestedParameterizedId, path: ['four'] }],
          data: {
            id: 31,
          },
        },
        [nestedParameterizedId]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: '31', path: ['four'] }],
          data: {
            five: 1,
          },
        },
      }, cacheContext).cacheSnapshot.baseline;
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceof(ParameterizedValueSnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('31')).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`restores parameterized NodeSnapshot from JSON serialization object`, () => {
      const parameterizedNode = restoreGraphSnapshot.getNodeSnapshot(parameterizedId)!;
      const entityData = restoreGraphSnapshot.getNodeData('31');

      expect(parameterizedNode.inbound).to.has.deep.members([{ id: QueryRootId, path: ['one', 'two'] }]);
      expect(parameterizedNode.outbound).to.has.deep.members([{ id: '31', path: ['three'] }]);
      expect(parameterizedNode.data).not.eq(undefined);
      expect(parameterizedNode.data!['three']).to.eq(entityData);
    });

  });
});
