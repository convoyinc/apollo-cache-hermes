import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
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

  describe(`updates leaf-values hanging off of a root`, () => {
    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(context, empty, valuesQuery, { foo: 123, bar: { baz: 'asdf' } });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, query(`{ foo }`), { foo: 321 });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`updates the value, and its container`, () => {
      expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({ foo: 321, bar: { baz: 'asdf' } });
    });

    it(`marks the root as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
    });

    it(`only contains the root node`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
    });

    it(`emits the edited node as an EntitySnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
    });

  });
});
