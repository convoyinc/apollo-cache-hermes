import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../src/nodes/EntitySnapshot';
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

  describe(`merge references payload`, () => {

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const rootValuesQuery = query(`{
        foo {
          id
          name
        }
        bar {
          id
          name
          extra
        }
      }`);
      const rootMergeQuery = query(`{
        foo {
          id
          name
        }
        bar {
          id
          extra
        }
      }`);

      const baselineResult = write(context, empty, rootValuesQuery, {
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar', extra: null },
      });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, rootMergeQuery, {
        foo: { id: 1, name: 'Foo Boo' },
        bar: { id: 2, extra: true },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`updates existing values in referenced nodes`, () => {
      expect(snapshot.getNodeData('1')).toEqual({ id: 1, name: 'Foo Boo' });
    });

    it(`inserts new values in referenced nodes`, () => {
      expect(snapshot.getNodeData('2')).toEqual({ id: 2, name: 'Bar', extra: true });
    });

    it(`updates references to the newly edited nodes`, () => {
      const root = snapshot.getNodeData(QueryRootId);
      expect(root.foo).toBe(snapshot.getNodeData('1'));
      expect(root.bar).toBe(snapshot.getNodeData('2'));
    });

    it(`doesn't mark regenerated nodes as edited`, () => {
      expect(Array.from(editedNodeIds).sort()).toEqual(['1', '2'].sort());
    });

    it(`contains the correct nodes`, () => {
      expect(snapshot.allNodeIds().sort()).toEqual([QueryRootId, '1', '2'].sort());
    });

    it(`emits the edited nodes as an EntitySnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).toBeInstanceOf(EntitySnapshot);
      expect(snapshot.getNodeSnapshot('1')).toBeInstanceOf(EntitySnapshot);
      expect(snapshot.getNodeSnapshot('2')).toBeInstanceOf(EntitySnapshot);
    });

  });

});
