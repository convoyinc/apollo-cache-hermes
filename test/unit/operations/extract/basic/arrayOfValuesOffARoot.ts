import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`new array of values hanging off of a root`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
        {
          viewer: [
            {
              postal: 123,
              name: 'Gouda',
            },
            {
              postal: 456,
              name: 'Brie',
            },
          ],
        },
        `{ viewer { postal name } }`,
        cacheContext
      );

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serializable object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          data: {
            viewer: [
              {
                postal: 123,
                name: 'Gouda',
              },
              {
                postal: 456,
                name: 'Brie',
              },
            ],
          },
        },
      });
    });

  });
});
