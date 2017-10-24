import { CacheContext } from '../../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { JsonObject } from '../../../../../src/primitive';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createGraphSnapshot, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

class Viewer {
  name: string;
  id: string;
  getName() {
    return this.name;
  }

  getId() {
    return this.id;
  }
}

function entityTransformer(node: JsonObject) {
  if (node['__typename'] === 'viewer') {
    Object.setPrototypeOf(node, Viewer.prototype);
  }
}

describe.skip(`operations.restore`, () => {
  describe(`new array of references hanging off of a root`, () => {

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = new CacheContext({
        ...strictConfig,
        entityTransformer,
      });

      originalGraphSnapshot = createGraphSnapshot(
        {
          viewer: [
            {
              __typename: 'viewer',
              id: 123,
              name: 'Gouda',
            },
            {
              __typename: 'viewer',
              id: 456,
              name: 'Brie',
            },
            null,
          ],
        },
        `{ viewer { __typename id name } }`,
        cacheContext
      );

      restoreGraphSnapshot = restore({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: '123', path: ['viewer', 0] },
            { id: '456', path: ['viewer', 1] },
          ],
          data: {
            viewer: [null, null, null],
          },
        },
        '123': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['viewer', 0] }],
          data: {  __typename: 'viewer', id: 123, name: 'Gouda' },
        },
        '456': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['viewer', 1] }],
          data: {  __typename: 'viewer', id: 456, name: 'Brie' },
        },
      }, cacheContext);
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('123')).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('456')).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`correctly restores NodeSnapshot, entity transformation on specific entity`, () => {
      expect(Object.getPrototypeOf(restoreGraphSnapshot.getNodeData('123'))).to.include.all.keys(['getName', 'getId']);
      expect(Object.getPrototypeOf(restoreGraphSnapshot.getNodeData('456'))).to.include.all.keys(['getName', 'getId']);
    });

    it(`correctly restores NodeSnapshot, no entity transformation on QueryRootId`, () => {
      expect(Object.getPrototypeOf(restoreGraphSnapshot.getNodeData(QueryRootId))).to.not.include.all.keys(['getName', 'getId']);
    });

  });
});
