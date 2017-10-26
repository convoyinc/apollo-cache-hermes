import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
import { restore } from '../../../../../src/operations';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`nested values hanging off of a root`, () => {

    let restoreGraphSnapshot: GraphSnapshot, originalSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      originalSnapshot = createGraphSnapshot(
        {
          bar: {
            value: 42,
            prop1: 'hello',
            prop2: {
              nestedProp1: 1000,
              nestedProp2: 'world',
            },
            prop3: ['hello', 'world'],
          },
        },
        `{
          bar {
            value
            prop1
            prop2
            prop3
          }
        }`,
        cacheContext
      );

      restoreGraphSnapshot = restore({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          data: {
            bar: {
              value: 42,
              prop1: 'hello',
              prop2: {
                nestedProp1: 1000,
                nestedProp2: 'world',
              },
              prop3: ['hello', 'world'],
            },
          },
        },
      }, cacheContext);
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
    });

  });
});
