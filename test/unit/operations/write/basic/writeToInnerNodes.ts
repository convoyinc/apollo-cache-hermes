import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { write } from '../../../../../src/operations/write';
import { NodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

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

  describe(`write to inner nodes`, () => {

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(context, empty, rootValuesQuery, {
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
      baseline = baselineResult.snapshot;

      const innerNodeQuery = query(`{ name extra }`, undefined, '1');
      const result = write(context, baseline, innerNodeQuery, {
        name: 'moo',
        extra: true,
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`edits the inner node`, () => {
      expect(snapshot.get('1')).to.deep.eq({ id: 1, name: 'moo', extra: true });
    });

    it(`marks only the inner node as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members(['1']);
    });

  });

});
