import { query, strictConfig } from '../../helpers';
import { Cache } from '../../../src';

describe(`readCache carry-forward`, () => {

  const thingQuery = query(`
    query thing($id: ID!) {
      thing(id: $id) {
        id
        ref { id }
      }
    }
  `);

  let cache: Cache;
  beforeEach(() => {
    cache = new Cache(strictConfig);
  });

  it(`the cache memoizes read results`, () => {
    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });

    expect(cache.getSnapshot().baseline.readCache.size).to.eq(0);
    cache.read({ ...thingQuery, variables: { id: 'a' } });
    expect(cache.getSnapshot().baseline.readCache.size).to.eq(1);
  });

  it(`carries cache results forward if no entities in the cached query were changed`, () => {
    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });
    cache.read({ ...thingQuery, variables: { id: 'a' } });

    cache.write({ ...thingQuery, variables: { id: 'b' } }, { thing: { id: 'b', ref: { id: 1 } } });
    expect(cache.getSnapshot().baseline.readCache.size).to.eq(1);
  });

  it(`drops cache results if entities in the cached query were changed`, () => {
    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });
    cache.read({ ...thingQuery, variables: { id: 'a' } });

    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 2 } } });
    expect(cache.getSnapshot().baseline.readCache.size).to.eq(0);
  });

  it(`drops cache results if containing entities in the cached query were changed`, () => {
    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });
    cache.read({ ...thingQuery, variables: { id: 'a' } });

    cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'b', ref: { id: 1 } } });
    expect(cache.getSnapshot().baseline.readCache.size).to.eq(0);
  });

});
