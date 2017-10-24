import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { extract } from '../../../../../src/operations/extract';
import { createOriginalGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

describe(`operations.extract`, () => {
  describe(`invalid values`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      snapshot = createOriginalGraphSnapshot(
        { nan: NaN, func: (() => {}) as any },
        `{
          nan
          func
        }`
      );
    });

    it(`throws error when extracting invalid values`, () => {
      expect(() => {
        extract(snapshot, createStrictCacheContext());
      }).to.throw(/unserializable/i);
    });

  });
});
