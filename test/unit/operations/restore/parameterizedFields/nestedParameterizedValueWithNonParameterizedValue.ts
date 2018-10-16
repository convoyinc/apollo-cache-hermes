import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`nested parameterized value with nested non-parameterized value`, () => {

    const parameterizedId = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two', 'three'],
      { id: 1, withExtra: true }
    );

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      originalGraphSnapshot = createGraphSnapshot(
        {
          one: {
            two: {
              bee: 'BEEZ',
              three: {
                name: 'ThreeName',
                extraValue: 42,
              },
            },
          },
        },
        `query getAFoo($id: ID!) {
          one {
            two {
              bee
              three(id: $id, withExtra: true) {
                name extraValue
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
          outbound: [{ id: parameterizedId, path: ['one', 'two', 'three'] }],
          data: {
            one: {
              two: {
                bee: 'BEEZ',
              },
            },
          },
        },
        [parameterizedId]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          data: {
            name: 'ThreeName',
            extraValue: 42,
          },
        },
      }, cacheContext).cacheSnapshot.baseline;
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      jestExpect(restoreGraphSnapshot).toEqual(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      jestExpect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).toBeInstanceOf(EntitySnapshot);
      jestExpect(restoreGraphSnapshot.getNodeSnapshot(parameterizedId)).toBeInstanceOf(ParameterizedValueSnapshot);
    });

  });
});
