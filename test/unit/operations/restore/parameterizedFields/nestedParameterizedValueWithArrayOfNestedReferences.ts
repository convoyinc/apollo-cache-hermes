import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`nested parameterized value with array of nested references`, () => {

    const parameterizedTopContainerId = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two'],
      { id: 1 }
    );

    const nestedParameterizedValueId0 = nodeIdForParameterizedValue(
      '31',
      ['four'],
      { extra: true },
    );

    const nestedParameterizedValueId1 = nodeIdForParameterizedValue(
      '32',
      ['four'],
      { extra: true },
    );

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      originalGraphSnapshot = createGraphSnapshot(
        {
          one: {
            two: [
              {
                three: {
                  id: 31,
                  four: { five: 1 },
                },
              },
              {
                three: {
                  id: 32,
                  four: { five: 1 },
                },
              },
              null,
            ],
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
          outbound: [{ id: parameterizedTopContainerId, path: ['one', 'two'] }],
        },
        [parameterizedTopContainerId]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two'] }],
          outbound: [
            { id: '31', path: [0, 'three'] },
            { id: '32', path: [1, 'three'] },
          ],
          data: [{ }, { }, null],
        },
        '31': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedTopContainerId, path: [0, 'three'] }],
          outbound: [{ id: nestedParameterizedValueId0, path: ['four'] }],
          data: {
            id: 31,
          },
        },
        [nestedParameterizedValueId0]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: '31', path: ['four'] }],
          data: {
            five: 1,
          },
        },
        [nestedParameterizedValueId1]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: '32', path: ['four'] }],
          data: {
            five: 1,
          },
        },
        '32': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedTopContainerId, path: [1, 'three'] }],
          outbound: [{ id: nestedParameterizedValueId1, path: ['four'] }],
          data: {
            id: 32,
          },
        },
      }, cacheContext);
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedTopContainerId)).to.be.an.instanceof(ParameterizedValueSnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot(nestedParameterizedValueId0)).to.be.an.instanceof(ParameterizedValueSnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('31')).to.be.an.instanceof(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot(nestedParameterizedValueId1)).to.be.an.instanceof(ParameterizedValueSnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('32')).to.be.an.instanceof(EntitySnapshot);
    });

  });
});
