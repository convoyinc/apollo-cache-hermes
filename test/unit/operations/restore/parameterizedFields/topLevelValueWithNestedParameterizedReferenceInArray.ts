import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`top-level values wtih nested parameterized value in an array`, () => {

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
            four: 'FOUR',
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
            four
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
              four: 'FOUR',
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
      }, cacheContext).cacheSnapshot.baseline;
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).toEqual(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).toBeInstanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedId0)).toBeInstanceOf(ParameterizedValueSnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('30')).toBeInstanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot(parameterizedId1)).toBeInstanceOf(ParameterizedValueSnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('31')).toBeInstanceOf(EntitySnapshot);
    });

  });
});
