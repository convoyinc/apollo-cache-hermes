import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { QueryResult, read, write } from '../../../../src/operations';
import { query, strictConfig } from '../../../helpers';

describe(`operations.read`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe.skip(`cyclic payload`, () => {
    let readResult: QueryResult;
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

      const foo = { name: 'Foo', bar: null as any };
      const bar = { name: 'Bar', foo };
      foo.bar = bar;

      const { snapshot } = write(context, empty, cyclicQuery, { foo, baz: null });
      readResult = read(context, cyclicQuery, snapshot)
    });

    it(`verify that read result is complete`, () => {
      expect(readResult.complete).to.eq(true);
    });

    it(`verify that read result is correct`, () => {
      // Note that we explicitly DO NOT construct graph cycles for
      // non-references!
      expect(readResult.result).to.deep.eq({
        foo: {
          name: 'Foo',
          bar: {
            name: 'Bar',
            foo: { name: 'Foo' },
          },
        },
      });
    });
  });

});