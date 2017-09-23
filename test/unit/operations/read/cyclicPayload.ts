import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { QueryResult, read, write } from '../../../../src/operations';
import { query, strictConfig } from '../../../helpers';

describe(`operations.read`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`cyclic payload`, () => {
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
            foo {
              id
              name
            }
          }
        }
      }`);

      const foo = { id: 0, name: 'Foo', bar: null as any };
      const bar = { id: 1, name: 'Bar', foo };
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
      const foo = {
        id: 0,
        name: 'Foo',
      }
      const bar = {
        id: 1,
        name: 'Bar',
        fizz: null,
        buzz: null,
        foo
      }
      foo["bar"] = bar;

      expect(readResult.result).to.deep.eq({ foo });
    });
  });

});