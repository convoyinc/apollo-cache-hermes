import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { extract } from '../../../../../src/operations/extract';
import { createSnapshot } from '../../../../helpers';

describe(`operations.extract`, () => {
  describe(`invalid values`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      snapshot = createSnapshot(
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
      ).snapshot;
    });

    it(`throws error when extracting invalid values`, () => {
      expect(() => {
        extract(snapshot);
      }).to.throw(/unserializable/);
    });

  });
});
