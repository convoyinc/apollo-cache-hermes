import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { NodeId } from '../../../../../src/schema';
import { createSnapshot, updateSnapshot } from '../../../../helpers';

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`remove inbound references on cyclic graph`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const cyclicRefQuery = `{
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
      }`;

      const baseline = createSnapshot(
        {
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
        },
        cyclicRefQuery
      ).snapshot;

      const result = updateSnapshot(
        baseline,
        {
          foo: {
            id: 1,
            name: 'Foo',
            bar: {
              id: 2,
              name: 'Bar',
              fizz: null,
              buzz: null,
            },
          },
        },
        cyclicRefQuery
      );

      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`fixes all references to the edited node`, () => {
      const foo = snapshot.getNodeData('1');
      const bar = snapshot.getNodeData('2');

      expect(foo.id).to.eq(1);
      expect(foo.name).to.eq('Foo');
      expect(foo.bar).to.eq(bar);

      expect(bar.id).to.eq(2);
      expect(bar.name).to.eq('Bar');
      expect(bar.fizz).to.eq(null);
      expect(bar.buzz).to.eq(null);
    });

    it(`only marks the edited node`, () => {
      expect(Array.from(editedNodeIds)).to.have.members(['2']);
    });
  });
});
