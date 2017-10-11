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

  describe(`cyclic references`, () => {

    describe(`payload with cyclic references`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
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

        const result = write(context, empty, cyclicQuery, {
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
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`constructs a normalized cyclic graph`, () => {
        const foo = snapshot.getNodeData('1');
        const bar = snapshot.getNodeData('2');

        expect(foo.id).to.eq(1);
        expect(foo.name).to.eq('Foo');
        expect(foo.bar).to.eq(bar);

        expect(bar.id).to.eq(2);
        expect(bar.name).to.eq('Bar');
        expect(bar.fizz).to.eq(foo);
        expect(bar.buzz).to.eq(bar);
      });

      it(`properly references the cyclic nodes via QueryRoot`, () => {
        expect(snapshot.getNodeData(QueryRootId).foo).to.eq(snapshot.getNodeData('1'));
      });

      it(`marks all the nodes as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1', '2']);
      });

    });

  });

});
