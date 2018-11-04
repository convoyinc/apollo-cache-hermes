import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { NodeId, StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`cyclic references payload`, () => {

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

      const result = createSnapshot(
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
      );

      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`constructs a normalized cyclic graph`, () => {
      const foo = snapshot.getNodeData('1');
      const bar = snapshot.getNodeData('2');

      jestExpect(foo.id).toBe(1);
      jestExpect(foo.name).toBe('Foo');
      jestExpect(foo.bar).toBe(bar);

      jestExpect(bar.id).toBe(2);
      jestExpect(bar.name).toBe('Bar');
      jestExpect(bar.fizz).toBe(foo);
      jestExpect(bar.buzz).toBe(bar);
    });

    it(`properly references the cyclic nodes via QueryRoot`, () => {
      jestExpect(snapshot.getNodeData(QueryRootId).foo).toBe(snapshot.getNodeData('1'));
    });

    it(`marks all the nodes as edited`, () => {
      jestExpect(Array.from(editedNodeIds)).toEqual(jestExpect.arrayContaining([QueryRootId, '1', '2']));
    });
  });
});
