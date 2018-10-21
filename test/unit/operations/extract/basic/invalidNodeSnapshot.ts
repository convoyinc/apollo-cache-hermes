import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { NodeSnapshot } from '../../../../../src/nodes';
import { extract } from '../../../../../src/operations/extract';
import { JsonValue } from '../../../../../src/primitive';
import { createStrictCacheContext } from '../../../../helpers';

describe(`operations.extract`, () => {
  describe(`invalid NodeSnapshot type`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      class InvalidNodeSnapshot implements NodeSnapshot {
        constructor(public data: JsonValue) {}
      }

      snapshot = new GraphSnapshot({
        'a': new InvalidNodeSnapshot(null),
      });
    });

    it(`throws error when extracting invalid NodeSnapshot type`, () => {
      expect(() => {
        const cacheContext = createStrictCacheContext();
        extract(snapshot, cacheContext);
      }).toThrow(/Serializable.NodeSnapshotType/i);
    });

  });
});
