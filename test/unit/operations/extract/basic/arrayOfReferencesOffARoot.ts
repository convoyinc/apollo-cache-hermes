import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`new array of references hanging off of a root`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          viewer: [
            {
              id: 123,
              name: 'Gouda',
            },
            {
              id: 456,
              name: 'Brie',
            },
          ],
        },
        `{ viewer { id name } }`
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extracts JSON serializable object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: '123', path: ['viewer', 0] },
            { id: '456', path: ['viewer', 1] },
          ],
          data: {
            viewer: [undefined, undefined],
          },
        },
        '123': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['viewer', 0] }],
          data: { id: 123, name: 'Gouda' },
        },
        '456': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['viewer', 1] }],
          data: { id: 456, name: 'Brie' },
        },
      });
    });

  });
});
