import { CacheContext } from '../../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
import { extract, restore } from '../../../../../src/operations';
import { JsonObject } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
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
  describe(`nested references in an array hanging off of a root`, () => {

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
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
        new CacheContext({
          ...strictConfig,
          addTypename: true,
          entityTransformer,
        })
      ).snapshot;

      restoreResult = restore(extract(snapshot));
    });

    it(`restores RootQuery NodeSnapshot from JSON serializable object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          {
            one: {
              two: {
                three: { __typename: 'Three', id: 0 },
              },
            },
          },
          /* inbound */ undefined,
          [{ id: '0', path: ['one', 'two', 'three'] }],
        )
      );
    });

    it(`restores id='0' NodeSnapshot from JSON serializable object`, () => {
      expect(restoreResult.getNodeSnapshot('0')).to.deep.eq(
        new EntitySnapshot(
          { __typename: 'Three', id: 0 },
          [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          /* outbound */ undefined
        )
      );
    });

    it(`correctly restore NodeSnapshot, entity transformation on specific entity`, () => {
      expect(Object.getPrototypeOf(restoreResult.getNodeData('0'))).to.include.all.keys(['getValue', 'getId']);
    });

    it(`correctly restore NodeSnapshot, no entity transformation on QueryRootId`, () => {
      expect(Object.getPrototypeOf(restoreResult.getNodeData(QueryRootId))).to.not.include.all.keys(['getValue', 'getId']);
    });

  });
});
