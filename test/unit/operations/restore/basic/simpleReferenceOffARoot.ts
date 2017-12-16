import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`simple references hanging off a root`, () => {

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      originalGraphSnapshot = createGraphSnapshot(
        {
          viewer: {
            id: 123,
            name: 'Gouda',
          },
          justValue: '42',
        },
        `{
          viewer {
            id
            name
          }
          justValue
        }`,
        cacheContext
      );

      restoreGraphSnapshot = restore({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: '123', path: ['viewer'] }],
          data: {
            justValue: '42',
          },
        },
        '123': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['viewer'] }],
          data: { id: 123, name: 'Gouda' },
        },
      }, cacheContext).cacheSnapshot.baseline;
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('123')).to.be.an.instanceOf(EntitySnapshot);
    });

  });
});
