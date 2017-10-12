import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { write } from '../../../../../src/operations/write';
import { StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`freezes snapshot values after write operation`, () => {

    it(`checks values referenced from the snapshot`, () => {
      const nestedQuery = query(`{
        foo {
          bar {
            baz
          }
        }
      }`);

      const snapshot = write(context, empty, nestedQuery, {
        foo: {
          bar: [
            { baz: 123 },
            { baz: 321 },
          ],
        },
      }).snapshot;

      expect(() => {
        const root = snapshot.getNodeData(QueryRootId);
        root.foo.bar[0].baz = 111;
      }).to.throw(/property.*baz/);

      expect(() => {
        const root = snapshot.getNodeData(QueryRootId);
        root.foo.fizz = 'nope';
      }).to.throw(/property.*fizz/);
    });

  });

});
