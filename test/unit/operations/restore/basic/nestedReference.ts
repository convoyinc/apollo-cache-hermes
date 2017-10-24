import { CacheContext } from '../../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { restore } from '../../../../../src/operations';
import { JsonObject } from '../../../../../src/primitive';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createSnapshot, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

function entityTransformer(node: JsonObject) {
  class Three {
    id: string;

    getId() {
      return this.id;
    }

    static getValue() {
      return 3;
    }
  }
  if (node['__typename'] === 'Three') {
    Object.setPrototypeOf(node, Three);
  }
}

describe.skip(`operations.restore`, () => {
  describe(`nested references`, () => {

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = new CacheContext({
        ...strictConfig,
        addTypename: true,
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
                three { id }
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
      }, cacheContext);
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('0')).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`correctly restore NodeSnapshot, entity transformation on specific entity`, () => {
      expect(Object.getPrototypeOf(restoreGraphSnapshot.getNodeData('0'))).to.include.all.keys(['getValue', 'getId']);
    });

    it(`correctly restore NodeSnapshot, no entity transformation on QueryRootId`, () => {
      expect(Object.getPrototypeOf(restoreGraphSnapshot.getNodeData(QueryRootId))).to.not.include.all.keys(['getValue', 'getId']);
    });

  });
});
