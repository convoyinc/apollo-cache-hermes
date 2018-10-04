import { CacheContext } from '../../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
import { restore } from '../../../../../src/operations';
import { JsonObject } from '../../../../../src/primitive';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createSnapshot, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

class Three {
  constructor(
    public id: string,
  ) {}

  getId() {
    return this.id;
  }

  getValue() {
    return 3 + this.id;
  }
}

function entityTransformer(node: JsonObject) {
  if (node['__typename'] === 'Three') {
    Object.setPrototypeOf(node, Three.prototype);
  }
}

describe(`operations.restore`, () => {
  describe(`nested references in an array`, () => {

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = new CacheContext({
        ...strictConfig,
        entityTransformer,
      });

      originalGraphSnapshot = createSnapshot(
        {
          one: {
            two: [
              { three: { __typename: 'Three', id: 0 } },
              { three: { __typename: 'Three', id: 1 } },
              null,
            ],
          },
        },
        `{
            one {
              two {
                three { __typename id }
              }
            }
        }`,
        /* gqlVariables */ undefined,
        /* rootId */ undefined,
        cacheContext
      ).snapshot;

      restoreGraphSnapshot = restore({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: '0', path: ['one', 'two', 0, 'three'] },
            { id: '1', path: ['one', 'two', 1, 'three'] },
          ],
          data: {
            one: {
              two: [{ }, { }, null],
            },
          },
        },
        '0': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
          data: { __typename: 'Three', id: 0 },
        },
        '1': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
          data: { __typename: 'Three', id: 1 },
        },
      }, cacheContext).cacheSnapshot.baseline;
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).toEqual(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).toBeInstanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('0')).toBeInstanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('1')).toBeInstanceOf(EntitySnapshot);
    });

    it(`correctly restore NodeSnapshot, entity transformation on specific entity`, () => {
      expect(restoreGraphSnapshot.getNodeData('0')).toBeInstanceOf(Three);
      expect(restoreGraphSnapshot.getNodeData('1')).toBeInstanceOf(Three);
    });

    it(`correctly restore NodeSnapshot, no entity transformation on QueryRootId`, () => {
      expect(restoreGraphSnapshot.getNodeData(QueryRootId)).not.toBeInstanceOf(Three);
    });

  });
});
