import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`simple references hanging off a root`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
        {
          viewer: {
            id: 123,
            name: 'Gouda',
          },
          justValue: '42',
        },
        `{
          viewer {
            id
            name
          }
          justValue
        }`,
        cacheContext
      );

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serializable object`, () => {
      jestExpect(extractResult).toEqual({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: '123', path: ['viewer'] }],
          data: {
            justValue: '42',
            viewer: undefined,
          },
        },
        '123': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['viewer'] }],
          data: { id: 123, name: 'Gouda' },
        },
      });
    });

  });
});
