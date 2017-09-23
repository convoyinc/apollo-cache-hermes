import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { write } from '../../../../src/operations/write';
import { StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const simpleQuery = query(`{ foo }`);
  const nestedQuery = query(`{
    foo {
      bar {
        baz
      }
    }
  }`);

  describe(`snapshot freezing`, () => {

    it(`freezes snapshots after writing`, () => {
      const snapshot = write(context, empty, nestedQuery, {
        foo: {
          bar: [
            { baz: 123 },
            { baz: 321 },
          ],
        },
      }).snapshot;

      expect(() => {
        const root = snapshot.get(QueryRootId);
        root.foo.bar[0].baz = 111;
      }).to.throw(/property.*baz/);

      expect(() => {
        const root = snapshot.get(QueryRootId);
        root.foo.fizz = 'nope';
      }).to.throw(/property.*fizz/);
    });

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
