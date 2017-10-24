import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createOriginalGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`simple references hanging off a root`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createOriginalGraphSnapshot(
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
        }`
      );

      extractResult = extract(snapshot, createStrictCacheContext());
    });

    it(`extracts JSON serializable object`, () => {
      expect(extractResult).to.deep.eq({
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
