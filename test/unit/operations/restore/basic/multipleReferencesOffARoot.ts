import { CacheContext } from '../../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
import { restore } from '../../../../../src/operations';
import { JsonObject } from '../../../../../src/primitive';
import { StaticNodeId, Serializable } from '../../../../../src/schema';
import { createSnapshot, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

class Foo {
  constructor(
    public id: string,
    public name: string,
    public isFoo: boolean,
  ) {}

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
  constructor(
    public id: string,
    public name: string,
    public isBar: boolean,
  ) {}

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

function entityTransformer(node: JsonObject) {
  switch (node['__typename']) {
    case 'Foo':
      Object.setPrototypeOf(node, Foo.prototype);
      break;
    case 'Bar':
      Object.setPrototypeOf(node, Bar.prototype);
      break;
  }
}

describe(`operations.restore`, () => {
  describe(`multiple references hanging off a root`, () => {

    let restoreGraphSnapshot: GraphSnapshot, originaGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = new CacheContext({
        ...strictConfig,
        entityTransformer,
      });

      originaGraphSnapshot = createSnapshot(
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
          bar { __typename id name isBar }
          foo { __typename id name isFoo }
        }`,
        /* gqlVariables */ undefined,
        /* rootId */ undefined,
        cacheContext
      ).snapshot;

      restoreGraphSnapshot = restore({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: '123', path: ['bar'] },
            { id: '456', path: ['foo'] },
          ],
          data: {},
        },
        '123': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['bar'] }],
          data: {
            __typename: 'Bar',
            id: 123,
            name: 'Gouda',
            isBar: true,
          },
        },
        '456': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['foo'] }],
          data: {
            __typename: 'Foo',
            id: 456,
            name: 'Brie',
            isFoo: true,
          },
        },
      }, cacheContext).cacheSnapshot.baseline;
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originaGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('123')).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('456')).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`correctly restore NodeSnapshot, entity transformation on specific entity`, () => {
      expect(restoreGraphSnapshot.getNodeData('123')).to.be.an.instanceOf(Bar);
      expect(restoreGraphSnapshot.getNodeData('456')).to.be.an.instanceOf(Foo);
    });

    it(`correctly restore NodeSnapshot, no entity transformation on QueryRootId`, () => {
      expect(restoreGraphSnapshot.getNodeData(QueryRootId)).to.not.be.an.instanceOf(Bar);
      expect(restoreGraphSnapshot.getNodeData(QueryRootId)).to.not.be.an.instanceOf(Foo);
    });

  });
});
