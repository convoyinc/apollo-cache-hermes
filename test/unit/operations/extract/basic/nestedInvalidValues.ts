import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { extract } from '../../../../../src/operations/extract';
import { createOriginalGraphSnapshot, strictCacheContext } from '../../../../helpers';

describe(`operations.extract`, () => {
  describe(`invalid values`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      snapshot = createOriginalGraphSnapshot(
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
        }`
      );
    });

    it(`throws error when extracting invalid values`, () => {
      expect(() => {
        extract(snapshot, strictCacheContext);
      }).to.throw(/unserializable/);
    });

  });
});