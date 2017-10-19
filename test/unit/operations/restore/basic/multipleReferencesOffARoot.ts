import * as _ from 'lodash';

import { CacheContext } from '../../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
import { extract, restore } from '../../../../../src/operations';
import { JsonObject } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

function entityTransformer(node: JsonObject) {
  class Foo {
    id: string;
    name: string;
    isFoo: boolean;

    getId() {
      return this.id;
    }
    getName() {
      return this.name;
    }
    isFooInstance() {
      return this.isFoo;
    }
  }

  class Bar {
    id: string;
    name: string;
    isBar: boolean;

    getId() {
      return this.id;
    }
    getName() {
      return this.name;
    }
    isBarInstance() {
      return this.isBar;
    }
  }

  switch (node['__typename']) {
    case 'Foo':
      Object.setPrototypeOf(node, Foo);
      break;
    case 'Bar':
      Object.setPrototypeOf(node, Bar);
      break;
  }
}

describe.skip(`operations.restore`, () => {
  describe(`simple references hanging off a root`, () => {

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          bar: {
            __typename: 'Bar',
            id: 123,
            name: 'Gouda',
            isBar: true,
          },
          foo: {
            __typename: 'Foo',
            id: 456,
            name: 'Brie',
            isFoo: true,
          },
        },
        `{
          bar { id name }
          foo { id name }
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
            bar: {
              __typename: 'Bar',
              id: 123,
              name: 'Gouda',
              isBar: true,
            },
            foo: {
              __typename: 'Foo',
              id: 456,
              name: 'Brie',
              isFoo: true,
            },
          },
          /* inbound */ undefined,
          [
            { id: '123', path: ['bar'] },
            { id: '456', path: ['foo'] },
          ]
        )
      );
    });

    it(`restores id='123' NodeSnapshot from JSON serializable object`, () => {
      expect(restoreResult.getNodeSnapshot('123')).to.deep.eq(
        new EntitySnapshot(
          {
            __typename: 'Bar',
            id: 123,
            name: 'Gouda',
            isBar: true,
          },
          [{ id: QueryRootId, path: ['bar'] }],
          /* outbound */ undefined
        )
      );
    });

    it(`restores id='456' NodeSnapshot from JSON serializable object`, () => {
      expect(restoreResult.getNodeSnapshot('456')).to.deep.eq(
        new EntitySnapshot(
          {
            __typename: 'Foo',
            id: 456,
            name: 'Brie',
            isFoo: true,
          },
          [{ id: QueryRootId, path: ['foo'] }],
          /* outbound */ undefined
        )
      );
    });

    it(`correctly restore NodeSnapshot, entity transformation on specific entity`, () => {
      expect(Object.getPrototypeOf(restoreResult.getNodeData('123'))).to.include.all.keys(['getName', 'getId', 'isBarInstance']);
      expect(Object.getPrototypeOf(restoreResult.getNodeData('456'))).to.include.all.keys(['getName', 'getId', 'isFooInstance']);
    });

    it(`correctly restore NodeSnapshot, no entity transformation on QueryRootId`, () => {
      expect(Object.getPrototypeOf(restoreResult.getNodeData(QueryRootId))).to.not.include.all.keys(['getName', 'getId']);
    });

  });
});
