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
  describe(`nested references in an array`, () => {

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: [
              { three: { __typename: 'Three', id: 0 } },
              { three: { __typename: 'Three', id: 1 } },
            ],
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

    it(`restores RootQuery JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          {
            one: {
              two: [
                { three: { __typename: 'Three', id: 0 } },
                { three: { __typename: 'Three', id: 1 } },
              ],
            },
          },
          /* inbound */ undefined,
          [
            { id: '0', path: ['one', 'two', 0, 'three'] },
            { id: '1', path: ['one', 'two', 1, 'three'] },
          ]
        )
      );
    });

    it(`restores id='0' JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot('0')).to.deep.eq(
        new EntitySnapshot(
          { __typename: 'Three', id: 0 },
          [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
          /* outbound */ undefined,
        )
      );
    });

    it(`extract id='1' serialization object`, () => {
      expect(restoreResult.getNodeSnapshot('1')).to.deep.eq(
        new EntitySnapshot(
          { __typename: 'Three', id: 1 },
          [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
          /* outbound */ undefined,
        )
      );
    });

    it(`correctly restore NodeSnapshot, entity transformation on specific entity`, () => {
      expect(Object.getPrototypeOf(restoreResult.getNodeData('0'))).to.include.all.keys(['getValue', 'getId']);
      expect(Object.getPrototypeOf(restoreResult.getNodeData('1'))).to.include.all.keys(['getValue', 'getId']);
    });

    it(`correctly restore NodeSnapshot, no entity transformation on QueryRootId`, () => {
      expect(Object.getPrototypeOf(restoreResult.getNodeData(QueryRootId))).to.not.include.all.keys(['getValue', 'getId']);
    });

  });
});
