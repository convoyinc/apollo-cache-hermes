import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { write } from '../../../../../src/operations/write';
import { query, strictConfig } from '../../../../helpers';

describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`freezes complex values referenced from the payload`, () => {

    it(`checks values references from the payload`, () => {
      const simpleQuery = query(`{ foo }`);
      const payload = {
        foo: {
          bar: [
            { baz: 123 },
            { baz: 321 },
          ],
        },
      };
      write(context, empty, simpleQuery, payload);

      expect(() => {
        payload.foo.bar[0].baz = 111;
      }).toThrow(/property.*baz/);

      expect(() => {
        (payload.foo as any).fizz = 'nope';
      }).toThrow(/property.*fizz/);
    });

  });

});
