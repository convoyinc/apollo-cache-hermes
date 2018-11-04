import { query, strictConfig } from '../../helpers';
import { Cache } from '../../../src';
import { RawOperation } from '../../../src/schema';

describe(`readCache carry-forward`, () => {

  const thingQuery = query(`
    query thing($id: ID!) {
      thing(id: $id) {
        id
        ref { id }
      }
    }
  `);

  function fullRead(cacheToReadFrom: Cache, queryToRead: RawOperation) {
    // We only track ids for observed queries; not one-offs.
    const unsubscribe = cacheToReadFrom.watch(queryToRead, () => {});
    // observers synchronously trigger a full read; we can unsub now.
    unsubscribe();
  }

  let cache: Cache;
  beforeEach(() => {
    cache = new Cache(strictConfig);
  });

  it(`the cache memoizes read results`, () => {
    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });

    expect(cache.getSnapshot().baseline.readCache.size).to.eq(0);
    fullRead(cache, { ...thingQuery, variables: { id: 'a' } });
    expect(cache.getSnapshot().baseline.readCache.size).to.eq(1);
  });

  it(`carries cache results forward if no entities in the cached query were changed`, () => {
    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });
    fullRead(cache, { ...thingQuery, variables: { id: 'a' } });

    cache.write({ ...thingQuery, variables: { id: 'b' } }, { thing: { id: 'b', ref: { id: 1 } } });
    expect(cache.getSnapshot().baseline.readCache.size).to.eq(1);
  });

  it(`drops cache results if entities in the cached query were changed`, () => {
    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });
    fullRead(cache, { ...thingQuery, variables: { id: 'a' } });

    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 2 } } });
    expect(cache.getSnapshot().baseline.readCache.size).to.eq(0);
  });

  it(`drops cache results if containing entities in the cached query were changed`, () => {
    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });
    fullRead(cache, { ...thingQuery, variables: { id: 'a' } });

    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'b', ref: { id: 1 } } });
    expect(cache.getSnapshot().baseline.readCache.size).to.eq(0);
  });

});
