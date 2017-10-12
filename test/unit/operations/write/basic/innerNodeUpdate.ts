import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { NodeId } from '../../../../../src/schema';
import { createBaselineEditedSnapshot, createUpdateEditedSnapshot } from '../../../../helpers';

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`inner nodes update`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baseline = createBaselineEditedSnapshot(
        {
          gqlString: `{
            foo {
              id
              name
            }
            bar {
              id
              name
            }
          }`,
        },
        {
          foo: { id: 1, name: 'Foo' },
          bar: { id: 2, name: 'Bar' },
        }
      ).snapshot;

      const result = createUpdateEditedSnapshot(baseline,
        {
          gqlString: `{ id name extra }`,
          rootId: '1',
        },
        {
          id: 1,
          name: 'moo',
          extra: true,
        }
      );
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`edits the inner node`, () => {
      expect(snapshot.getNodeData('1')).to.deep.eq({ id: 1, name: 'moo', extra: true });
    });

    it(`marks only the inner node as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members(['1']);
    });

  });

});
