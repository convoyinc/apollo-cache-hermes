import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { NodeId } from '../../../../../src/schema';
import { createSnapshot, updateSnapshot } from '../../../../helpers';

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`edit cyclic graph`, () => {

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
              name: 'Barrington',
              fizz: { id: 1 },
              buzz: { id: 2 },
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

      expect(foo.id).toBe(1);
      expect(foo.name).toBe('Foo');
      expect(foo.bar).toBe(bar);

      expect(bar.id).toBe(2);
      expect(bar.name).toBe('Barrington');
      expect(bar.fizz).toBe(foo);
      expect(bar.buzz).toBe(bar);
    });

    it(`only marks the edited node`, () => {
      expect(Array.from(editedNodeIds)).toEqual(['2']);
    });
  });
});
