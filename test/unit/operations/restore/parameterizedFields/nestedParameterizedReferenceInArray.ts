import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { ParameterizedValueSnapshot, EntitySnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`nested parameterized references in array`, () => {

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

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      originalGraphSnapshot = createGraphSnapshot(
        {
          one: {
            two: [
              {
                three: {
                  id: '30',
                  name: 'Three0',
                  extraValue: '30-42',
                },
              },
              {
                three: {
                  id: '31',
                  name: 'Three1',
                  extraValue: '31-42',
                },
              },
              null,
            ],
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
        cacheContext,
        { id: 1 }
      );

      restoreGraphSnapshot = restore({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: parameterizedId0, path: ['one', 'two', 0, 'three'] },
            { id: parameterizedId1, path: ['one', 'two', 1, 'three'] },
          ],
          data: {
            one: {
              two: [null, null, null],
            },
          },
        },
        [parameterizedId0]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
          outbound: [{ id: '30', path: [] }],
          data: null,
        },
        '30': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId0, path: [] }],
          data: {
            id: '30',
            name: 'Three0',
            extraValue: '30-42',
          },
        },
        [parameterizedId1]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
          outbound: [{ id: '31', path: [] }],
          data: null,
        },
        '31': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId1, path: [] }],
          data: {
            id: '31',
            name: 'Three1',
            extraValue: '31-42',
          },
        },
      }, cacheContext);
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedId0)).to.be.an.instanceof(ParameterizedValueSnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('30')).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedId1)).to.be.an.instanceof(ParameterizedValueSnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('31')).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`restores parameterized NodeSnapshot in an array at index=0 from JSON serialization object`, () => {
      const parameterizedElement0 = restoreGraphSnapshot.getNodeSnapshot(parameterizedId0)!;
      const entityElement0 = restoreGraphSnapshot.getNodeData('30');

      expect(parameterizedElement0.inbound).to.have.deep.members([{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }]);
      expect(parameterizedElement0.outbound).to.have.deep.members([{ id: '30', path: [] }]);
      expect(parameterizedElement0.data).to.eq(entityElement0);
    });

    it(`restores parameterized NodeSnapshot at index=1 from JSON serialization object`, () => {
      const parameterizedElement1 = restoreGraphSnapshot.getNodeSnapshot(parameterizedId1)!;
      const entityElement1 = restoreGraphSnapshot.getNodeData('31');

      expect(parameterizedElement1).to.be.an.instanceof(ParameterizedValueSnapshot);
      expect(parameterizedElement1.inbound).to.have.deep.members([{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }]);
      expect(parameterizedElement1.outbound).to.have.deep.members([{ id: '31', path: [] }]);
      expect(parameterizedElement1.data).to.eq(entityElement1);
    });

  });
});
