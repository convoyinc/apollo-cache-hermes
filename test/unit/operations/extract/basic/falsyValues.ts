import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`falsy values`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
        { null: null, false: false, zero: 0, string: '' },
        `{ null, false, zero, string }`,
        cacheContext
      );

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serializable object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          data: { null: null, false: false, zero: 0, string: '' },
        },
      });
    });

  });
});
