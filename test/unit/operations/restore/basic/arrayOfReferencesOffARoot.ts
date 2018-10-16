import { CacheContext } from '../../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { JsonObject } from '../../../../../src/primitive';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createGraphSnapshot, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

class Viewer {
  constructor(
    public name: string,
    public id: string,
  ) {}

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

describe(`operations.restore`, () => {
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
      }, cacheContext).cacheSnapshot.baseline;
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      jestExpect(restoreGraphSnapshot).toEqual(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      jestExpect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).toBeInstanceOf(EntitySnapshot);
      jestExpect(restoreGraphSnapshot.getNodeSnapshot('123')).toBeInstanceOf(EntitySnapshot);
      jestExpect(restoreGraphSnapshot.getNodeSnapshot('456')).toBeInstanceOf(EntitySnapshot);
    });

    it(`correctly restores NodeSnapshot, entity transformation on specific entity`, () => {
      jestExpect(restoreGraphSnapshot.getNodeData('123')).toBeInstanceOf(Viewer);
      jestExpect(restoreGraphSnapshot.getNodeData('456')).toBeInstanceOf(Viewer);
    });

    it(`correctly restores NodeSnapshot, no entity transformation on QueryRootId`, () => {
      jestExpect(restoreGraphSnapshot.getNodeData(QueryRootId)).not.toBeInstanceOf(Viewer);
    });

  });
});
