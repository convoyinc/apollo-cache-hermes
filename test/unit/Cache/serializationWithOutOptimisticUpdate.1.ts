import { Cache } from '../../../src/Cache';
import { CacheSnapshot } from '../../../src/CacheSnapshot';
import { Serializable } from '../../../src/schema';
import { query, strictConfig } from '../../helpers';

describe.skip(`Cache`, () => {
  describe(`serialization without optimistic update`, () => {

    const getAFooQuery =  query(`query getAFoo($id: ID!) {
      one {
        two {
          three(id: $id, withExtra: true) {
            id name extraValue
          }
        }
      }
    }`);

    let originalCacheSnapshot: CacheSnapshot, extractResult: Serializable.GraphSnapshot, storedExtractResult: string;
    beforeEach(() => {
      const cache = new Cache(strictConfig);
      cache.write(
        getAFooQuery,
        {
          one: {
            two: [
              {
                three: {
                  id: '30',
                  name: 'Three0',
                  extraValue: '30-42',
                },
              },
              {
                three: {
                  id: '31',
                  name: 'Three1',
                  extraValue: '31-42',
                },
              },
              null,
            ],
          },
        },
      );
      originalCacheSnapshot = cache.getSnapshot();
      extractResult = cache.extract(/* optimistic */ false);
      storedExtractResult = JSON.stringify(extractResult);
    });

    it(`extract, stringify, and restore cache`, () => {
      const newCache = new Cache();
      newCache.restore(JSON.parse(storedExtractResult));
      expect(newCache.getSnapshot()).to.deep.eq(originalCacheSnapshot);
    });

    it(`extract and restore cache`, () => {
      const newCache = new Cache();
      newCache.restore(extractResult);
      expect(newCache.getSnapshot()).to.deep.eq(originalCacheSnapshot);
    });

  });
});
