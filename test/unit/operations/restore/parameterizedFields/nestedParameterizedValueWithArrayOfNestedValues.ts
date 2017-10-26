import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`nested parameterized value with an array of nested values`, () => {

    const parameterizedId = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two'],
      { id: 1 }
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
                  threeValue: 'first',
                },
              },
              {
                three: {
                  threeValue: 'second',
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
                threeValue
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
          data: [
            {
              three: {
                threeValue: 'first',
              },
            },
            {
              three: {
                threeValue: 'second',
              },
            },
            null,
          ],
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
