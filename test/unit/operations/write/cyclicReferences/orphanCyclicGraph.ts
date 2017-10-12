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

  describe(`orphan a cyclic subgraph`, () => {

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const cyclicQuery = query(`{
        foo {
          id
          name
          bar {
            id
            name
            fizz { id }
            buzz { id }
          }
        }
      }`);

      const baselineResult = write(context, empty, cyclicQuery, {
        foo: {
          id: 1,
          name: 'Foo',
          bar: {
            id: 2,
            name: 'Bar',
            fizz: { id: 1 },
            buzz: { id: 2 },
          },
        },
      });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, cyclicQuery, {
        foo: null,
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`removes the reference to the subgraph`, () => {
      expect(snapshot.getNodeData(QueryRootId).foo).to.eq(null);
    });

    // TODO: Detect this case, and actually make it work.  Mark & sweep? :(
    it.skip(`garbage collects the orphaned subgraph`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
    });

    it.skip(`marks all nodes as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1', '2']);
    });
  });
});
