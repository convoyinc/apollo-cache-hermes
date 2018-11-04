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

        jestExpect(foo.id).toBe(1);
        jestExpect(foo.name).toBe('Foo');
        jestExpect(foo.bar).toBe(bar);

        jestExpect(bar.id).toBe(2);
        jestExpect(bar.name).toBe('Bar');
        jestExpect(bar.fizz).toBe(foo);
        jestExpect(bar.buzz).toBe(bar);
      });

      it(`is marked complete`, () => {
        const { complete } = read(context, cyclicQuery, snapshot);
        jestExpect(complete).toBe(true);
      });

      it(`includes all related node ids, if requested`, () => {
        const { entityIds } = read(context, cyclicQuery, snapshot, true);
        jestExpect(Array.from(entityIds)).toEqual(jestExpect.arrayContaining([QueryRootId, '1', '2']));
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
              name: null,
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

        jestExpect(foo.id).toBe(1);
        jestExpect(foo.name).toBe('Foo');
        jestExpect(foo.bar).toBe(bar);

        jestExpect(bar.id).toBe(2);
        jestExpect(bar.name).toBe(null);
        jestExpect(bar.fizz).toBe(foo);
        jestExpect(bar.buzz).toBe(bar);
      });

      it(`is marked complete`, () => {
        const { complete } = read(context, cyclicQuery, snapshot);
        jestExpect(complete).toBe(true);
      });

      it(`includes all related node ids, if requested`, () => {
        const { entityIds } = read(context, cyclicQuery, snapshot, true);
        jestExpect(Array.from(entityIds)).toEqual(jestExpect.arrayContaining([QueryRootId, '1', '2']));
      });

    });

  });

});
