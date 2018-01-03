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

    let cache: Cache, debug: jest.Mock<any>, info: jest.Mock<any>, warn: jest.Mock<any>;
    beforeEach(() => {
      debug = jest.fn();
      info = jest.fn();
      warn = jest.fn();
      cache = new Cache({
        logger: { debug, info, warn, group: jest.fn(), groupEnd: jest.fn() },
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

      expect(warn.mock.calls.length).to.eq(1);
      expect(warn.mock.calls[0]).to.include(exception.toString());
    });

    it(`read optimistic transaction`, () => {
      cache.transaction(
        /** changeIdOrCallback */'123',
        (transaction) => {
          transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hello' } });
        }
      );

      expect(cache.read(simpleQuery, /** optimistic */ true).result).to.deep.eq({
        foo: { bar: 1, baz: 'hello' },
      });
    });

    it(`read multiple optimistic transactions`, () => {
      cache.transaction(
        /** changeIdOrCallback */'123',
        (transaction) => {
          transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hello' } });
        }
      );

      const otherQuery = query(`{
        fizz {
          buzz
        }
      }`);

      cache.transaction(
        /** changeIdOrCallback */'456',
        (transaction) => {
          transaction.write(otherQuery, { fizz: { buzz: 'boom' } });
        }
      );

      expect(cache.read(simpleQuery, /** optimistic */ true).result).to.deep.include({
        foo: { bar: 1, baz: 'hello' },
      });

      expect(cache.read(otherQuery, /** optimistic */ true).result).to.deep.include({
        fizz: { buzz: 'boom' },
      });
    });

  });
});
