import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { NodeId } from '../../../../../src/schema';
import { createSnapshot, updateSnapshot } from '../../../../helpers';

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`inner nodes update`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baseline = createSnapshot(
        {
          foo: { id: 1, name: 'Foo' },
          bar: { id: 2, name: 'Bar' },
        },
        `{
          foo {
            id
            name
          }
          bar {
            id
            name
          }
        }`
      ).snapshot;

      const result = updateSnapshot(baseline,
        {
          id: 1,
          name: 'moo',
          extra: true,
        },
        `{ id name extra }`,
        /* gqlVariables */ undefined,
        /* rootId */ '1'
      );
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`edits the inner node`, () => {
      jestExpect(snapshot.getNodeData('1')).toEqual({ id: 1, name: 'moo', extra: true });
    });

    it(`marks only the inner node as edited`, () => {
      jestExpect(Array.from(editedNodeIds)).toEqual(jestExpect.arrayContaining(['1']));
    });

  });

});
