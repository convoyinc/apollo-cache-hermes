import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`multiple references hanging off a root`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
        {
          bar: {
            id: 123,
            name: 'Gouda',
          },
          foo: {
            id: 456,
            name: 'Brie',
          },
        },
        `{
          bar { id name }
          foo { id name }
        }`,
        cacheContext
      );

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serializable object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: '123', path: ['bar'] },
            { id: '456', path: ['foo'] },
          ],
          data: {
            bar: undefined,
            foo: undefined,
          },
        },
        '123': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['bar'] }],
          data: { id: 123, name: 'Gouda' },
        },
        '456': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['foo'] }],
          data: { id: 456, name: 'Brie' },
        },
      });
    });

  });
});
