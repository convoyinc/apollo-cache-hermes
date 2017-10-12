import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { write } from '../../../../../src/operations/write';
import { query, strictConfig } from '../../../../helpers';

describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const simpleQuery = query(`{ foo }`);

  describe(`snapshot freezing`, () => {

    it(`freezes complex values referenced from the payload`, () => {
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
      }).to.throw(/property.*baz/);

      expect(() => {
        (payload.foo as any).fizz = 'nope';
      }).to.throw(/property.*fizz/);
    });

  });

});
