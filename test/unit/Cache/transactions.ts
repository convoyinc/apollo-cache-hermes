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

    let cache: Cache, warn: jest.Mock<any>, error: jest.Mock<any>;
    beforeEach(() => {
      warn = jest.fn();
      error = jest.fn();
      cache = new Cache({
        logger: { warn, error },
      });
    });

    it(`commits on success`, () => {
      cache.transaction((transaction) => {
        transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
      });

      expect(cache.getEntity(QueryRootId)).to.deep.eq({
        foo: { bar: 1, baz: 'hi' },
      });
      expect(cache.getSnapshot().baseline).to.deep.eq(cache.getSnapshot().optimistic);
    });

    it(`doesn't modify the cache until completion`, () => {
      cache.transaction((transaction) => {
        transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
        expect(cache.getEntity(QueryRootId)).to.eq(undefined);
      });
    });

    it(`rolls back on error`, () => {
      cache.transaction((transaction) => {
        transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
        throw new Error(`bewm`);
      });

      expect(cache.getEntity(QueryRootId)).to.eq(undefined);
    });

    it(`logs on error`, () => {
      const exception = new Error(`bewm`);
      cache.transaction((transaction) => {
        transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
        throw exception;
      });

      expect(error.mock.calls.length).to.eq(1);
      expect(error.mock.calls[0]).to.include(exception);
    });

  });
});
