import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { extract } from '../../../../../src/operations/extract';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

describe(`operations.extract`, () => {
  describe(`invalid values`, () => {

    let snapshot: GraphSnapshot, cacheContext: CacheContext;
    beforeAll(() => {
      cacheContext = createStrictCacheContext();
      snapshot = createGraphSnapshot(
        {
          nestedInvalid: {
            nan: NaN,
            func: (() => {}) as any,
          },
        },
        `{ 
          nestedInvalid {
            nan
            func
          }
        }`,
        cacheContext
      );
    });

    it(`throws error when extracting invalid values`, () => {
      expect(() => {
        extract(snapshot, cacheContext);
      }).toThrow(/unserializable/i);
    });

  });
});
