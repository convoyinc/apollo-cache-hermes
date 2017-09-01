import { Cache } from '../../../src/Cache';
import { StaticNodeId } from '../../../src/schema';
import { query } from '../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`Cache`, () => {
  describe(`transactions`, () => {

    const simpleQuery = query(`{
      foo {
        bar
        baz
      }
    }`);

    let cache: Cache;
    beforeEach(() => {
      cache = new Cache({
        logger: {
          warn: jest.fn(),
          error: jest.fn(),
        },
      });
    });

    it(`commits on success`, () => {
      cache.transaction((transaction) => {
        transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
      });

      expect(cache.getEntity(QueryRootId)).to.deep.eq({
        foo: { bar: 1, baz: 'hi' },
      });
    });

    it(`doesn't modify the cache until completion`, () => {
      cache.transaction((transaction) => {
        transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
        expect(cache.getEntity(QueryRootId)).to.eq(undefined);
      });
    });

    it(`rolls back on error`, () => {
      expect(cache.getEntity(QueryRootId)).to.eq(undefined);
    });

  });
});
