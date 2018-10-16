import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { write } from '../../../../../src/operations/write';
import { NodeId, StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const rootValuesQuery = query(`{
    foo {
      id
      name
    }
    bar {
      id
      name
    }
  }`);

  describe(`orphans a node`, () => {
    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(context, empty, rootValuesQuery, {
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
      jestExpect(snapshot.getNodeData(QueryRootId)).toEqual({
        foo: { id: 1, name: 'Foo' },
        bar: null,
      });
    });

    it(`updates outbound references`, () => {
      const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
      jestExpect(queryRoot.outbound).toEqual([{ id: '1', path: ['foo'] }]);
    });

    it(`marks the container and orphaned node as edited`, () => {
      jestExpect(Array.from(editedNodeIds)).toEqual([QueryRootId, '2']);
    });

    it(`contains the correct nodes`, () => {
      jestExpect(snapshot.allNodeIds().sort()).toEqual([QueryRootId, '1'].sort());
    });

  });

});
