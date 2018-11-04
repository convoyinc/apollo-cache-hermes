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
  const valuesQuery = query(`{ foo bar }`);

  describe(`updates nested values hanging off of a root`, () => {
    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(context, empty, valuesQuery, {
        foo: [{ value: 1 }, { value: 2 }, { value: 3 }],
        bar: { baz: 'asdf' },
      });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, valuesQuery, {
        foo: [{ value: -1 }, { extra: true }],
        bar: {
          baz: 'fdsa',
          fizz: 'buzz',
        },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`merges new properties with existing objects`, () => {
      jestExpect(snapshot.getNodeData(QueryRootId).bar).toEqual({ baz: 'fdsa', fizz: 'buzz' });
    });

    it(`honors array lengths`, () => {
      jestExpect(snapshot.getNodeData(QueryRootId).foo.length).toBe(2);
    });

    it(`overwrites previous values in array elements`, () => {
      jestExpect(snapshot.getNodeData(QueryRootId).foo[0]).toEqual({ value: -1 });
    });

    it(`no merging of new values in array elements as we copy leaf value`, () => {
      jestExpect(snapshot.getNodeData(QueryRootId).foo[1]).toEqual({ extra: true });
    });

    it(`marks the root as edited`, () => {
      jestExpect(Array.from(editedNodeIds)).toEqual(jestExpect.arrayContaining([QueryRootId]));
    });

    it(`only contains the root node`, () => {
      jestExpect(snapshot.allNodeIds()).toEqual(jestExpect.arrayContaining([QueryRootId]));
    });

  });
});
