import { Cache } from '../../../src/Cache';
import { StaticNodeId } from '../../../src/schema';
import { query } from '../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

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
    cache.transaction(true, (transaction) => {
      transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
    });

    expect(cache.getEntity(QueryRootId)).to.deep.eq({
      foo: { bar: 1, baz: 'hi' },
    });
    expect(cache.getSnapshot().baseline).to.deep.eq(cache.getSnapshot().optimistic);
  });

  it(`can modify`, () => {
    cache.transaction(true, (transaction) => {
      transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
    });
    cache.transaction(true, (transaction) => {
      transaction.modify({
        fields: {
          foo: (current: any) => {
            current.bar = (current.bar ?? 0) + 1;
            return current;
          },
        },
      });
    });

    expect(cache.getEntity(QueryRootId)).to.deep.eq({
      foo: { bar: 2, baz: 'hi' },
    });
    expect(cache.getSnapshot().baseline).to.deep.eq(cache.getSnapshot().optimistic);
  });

  it(`doesn't modify the cache until completion`, () => {
    cache.transaction(true, (transaction) => {
      transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
      expect(cache.getEntity(QueryRootId)).to.eq(undefined);
    });
  });

  it(`rolls back on error`, () => {
    cache.transaction(true, (transaction) => {
      transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
      throw new Error(`bewm`);
    });

    expect(cache.getEntity(QueryRootId)).to.eq(undefined);
  });

  it(`logs on error`, () => {
    const exception = new Error(`bewm`);
    cache.transaction(true, (transaction) => {
      transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
      throw exception;
    });

    expect(warn.mock.calls.length).to.eq(1);
    expect(warn.mock.calls[0]).to.include(exception.toString());
  });

  it(`read optimistic transaction`, () => {
    cache.transaction(
      true,
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
      true,
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
      true,
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

  it(`rolls back optimistic transactions`, () => {
    cache.transaction(true, /** changeIdOrCallback */ '123', (transaction) => {
      transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hello' } });
    });

    expect(cache.read(simpleQuery, /** optimistic */ true).result).to.deep.eq({
      foo: { bar: 1, baz: 'hello' },
    });

    cache.transaction(true, (transaction) => {
      transaction.rollback('123');
    });

    expect(cache.read(simpleQuery, /** optimistic */ true).result).to.eq(
      undefined
    );
  });
});
