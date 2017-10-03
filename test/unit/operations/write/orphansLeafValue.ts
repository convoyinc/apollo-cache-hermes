import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { write } from '../../../../src/operations/write';
import { NodeId, StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`when orphaning a node`, () => {
    const simpleEntitiesQuery = query(`{
      foo { id name }
      bar { id name }
    }`);

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(context, empty, simpleEntitiesQuery, {
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, query(`{ bar { id } }`), {
        bar: null,
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`replaces the reference with null`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({
        foo: { id: 1, name: 'Foo' },
        bar: null,
      });
    });

    it(`updates outbound references`, () => {
      const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
      expect(queryRoot.outbound).to.deep.eq([
        { id: '1', path: ['foo'] },
      ]);
    });

    it(`marks the container and orphaned node as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '2']);
    });

    it(`contains the correct nodes`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1']);
    });

  });

  describe(`orphan a subgraph`, () => {
    const subgraphQuery = query(`{
      foo {
        id
        name
        two { id }
      }
      bar {
        id
        name
        one { id }
        two { id }
        three {
          id
          foo { id }
        }
      }
    }`);

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(context, empty, subgraphQuery, {
        foo: {
          id: 1,
          name: 'Foo',
          two: { id: 222 },
        },
        bar: {
          id: 2,
          name: 'Bar',
          one: { id: 111 },
          two: { id: 222 },
          three: {
            id: 333,
            foo: { id: 1 },
          },
        },
      });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, subgraphQuery, {
        foo: { id: 1, name: 'Foo', two: null },
        bar: null,
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`replaces the reference with null`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({
        foo: { id: 1, name: 'Foo', two: null },
        bar: null,
      });
    });

    it(`no outbound references`, () => {
      const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
      expect(queryRoot.outbound).to.deep.eq([
        { id: '1', path: ['foo'] },
      ]);
    });

    it(`marks the container and all orphaned nodes as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1', '2', '111', '222', '333']);
    });

    it(`contains the correct nodes`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1']);
    });

  });
});
