import { CacheContext } from '../../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
import { extract, restore } from '../../../../../src/operations';
import { JsonObject } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

function entityTransformer(node: JsonObject) {
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

  if (node['__typename'] === 'viewer') {
    Object.setPrototypeOf(node, Viewer);
  }
}

describe.skip(`operations.restore`, () => {
  describe(`new array of references hanging off of a root`, () => {

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
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
          ],
        },
        `{ viewer { id name } }`,
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
            ],
          },
          /* inbound */ undefined,
          [
            { id: '123', path: ['viewer', 0] },
            { id: '456', path: ['viewer', 1] },
          ]
        )
      );
    });

    it(`restores id='123' NodeSnapshot from JSON serializable object`, () => {
      expect(restoreResult.getNodeSnapshot('123')).to.deep.eq(
        new EntitySnapshot(
          { __typename: 'viewer', id: 123, name: 'Gouda' },
          [{ id: QueryRootId, path: ['viewer'] }],
          /* outbound */ undefined
        )
      );
    });

    it(`restores id='456' NodeSnapshot from JSON serializable object`, () => {
      expect(restoreResult.getNodeSnapshot('456')).to.deep.eq(
        new EntitySnapshot(
          { __typename: 'viewer', id: 456, name: 'Brie' },
          [{ id: QueryRootId, path: ['viewer'] }],
          /* outbound */ undefined
        )
      );
    });

    it(`correctly restores NodeSnapshot, entity transformation on specific entity`, () => {
      expect(Object.getPrototypeOf(restoreResult.getNodeData('123'))).to.include.all.keys(['getName', 'getId']);
      expect(Object.getPrototypeOf(restoreResult.getNodeData('456'))).to.include.all.keys(['getName', 'getId']);
    });

    it(`correctly restores NodeSnapshot, no entity transformation on QueryRootId`, () => {
      expect(Object.getPrototypeOf(restoreResult.getNodeData(QueryRootId))).to.not.include.all.keys(['getName', 'getId']);
    });

  });
});
