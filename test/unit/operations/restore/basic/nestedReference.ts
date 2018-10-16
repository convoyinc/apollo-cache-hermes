import { CacheContext } from '../../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
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
  describe(`nested references`, () => {

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = new CacheContext({
        ...strictConfig,
        entityTransformer,
      });

      originalGraphSnapshot = createSnapshot(
        {
          one: {
            two: {
              three: { __typename: 'Three', id: 0 },
            },
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
          outbound: [{ id: '0', path: ['one', 'two', 'three'] }],
          data: {
            one: {
              two: {},
            },
          },
        },
        '0': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          data: { __typename: 'Three', id: 0 },
        },
      }, cacheContext).cacheSnapshot.baseline;
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      jestExpect(restoreGraphSnapshot).toEqual(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      jestExpect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).toBeInstanceOf(EntitySnapshot);
      jestExpect(restoreGraphSnapshot.getNodeSnapshot('0')).toBeInstanceOf(EntitySnapshot);
    });

    it(`correctly restore NodeSnapshot, entity transformation on specific entity`, () => {
      jestExpect(restoreGraphSnapshot.getNodeData('0')).toBeInstanceOf(Three);
    });

    it(`correctly restore NodeSnapshot, no entity transformation on QueryRootId`, () => {
      jestExpect(restoreGraphSnapshot.getNodeData(QueryRootId)).not.toBeInstanceOf(Three);
    });

  });
});
