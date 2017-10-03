import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { read, write } from '../../../../src/operations';
import { RawOperation, StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.read`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`cyclic references`, () => {
    describe(`in a complete cache`, () => {

      let cyclicQuery: RawOperation, snapshot: GraphSnapshot;
      beforeAll(() => {
        cyclicQuery = query(`{
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

        snapshot = write(context, empty, cyclicQuery, {
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
        }).snapshot;
      });

      it(`can be read`, () => {
        const { result } = read(context, cyclicQuery, snapshot);
        const foo = (result as any).foo;
        const bar = foo.bar;

        expect(foo.id).to.eq(1);
        expect(foo.name).to.eq('Foo');
        expect(foo.bar).to.eq(bar);

        expect(bar.id).to.eq(2);
        expect(bar.name).to.eq('Bar');
        expect(bar.fizz).to.eq(foo);
        expect(bar.buzz).to.eq(bar);
      });

      it(`is marked complete`, () => {
        const { complete } = read(context, cyclicQuery, snapshot);
        expect(complete).to.eq(true);
      });

      it(`includes all related node ids, if requested`, () => {
        const { nodeIds } = read(context, cyclicQuery, snapshot, true);
        expect(Array.from(nodeIds)).to.have.members([QueryRootId, '1', '2']);
      });

    });

    describe(`in a partial cache`, () => {

      let cyclicQuery: RawOperation, snapshot: GraphSnapshot;
      beforeAll(() => {
        cyclicQuery = query(`{
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

        snapshot = write(context, empty, cyclicQuery, {
          foo: {
            id: 1,
            name: 'Foo',
            bar: {
              id: 2,
              fizz: { id: 1 },
              buzz: { id: 2 },
            },
          },
        }).snapshot;
      });

      it(`can be read`, () => {
        const { result } = read(context, cyclicQuery, snapshot);
        const foo = (result as any).foo;
        const bar = foo.bar;

        expect(foo.id).to.eq(1);
        expect(foo.name).to.eq('Foo');
        expect(foo.bar).to.eq(bar);

        expect(bar.id).to.eq(2);
        expect(bar.name).to.eq(null);
        expect(bar.fizz).to.eq(foo);
        expect(bar.buzz).to.eq(bar);
      });

      it(`is marked complete`, () => {
        const { complete } = read(context, cyclicQuery, snapshot);
        expect(complete).to.eq(true);
      });

      it(`includes all related node ids, if requested`, () => {
        const { nodeIds } = read(context, cyclicQuery, snapshot, true);
        expect(Array.from(nodeIds)).to.have.members([QueryRootId, '1', '2']);
      });

    });

  });

});
