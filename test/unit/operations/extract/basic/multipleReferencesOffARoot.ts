import { extract } from '../../../../../src/operations/extract';
import { Serializeable, StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`simple references hanging off a root`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
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
        }`
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extracts JSON serializable object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializeable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: '123', path: ['bar'] },
            { id: '456', path: ['foo'] },
          ],
          data: {},
        },
        '123': {
          type: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['bar'] }],
          data: { id: 123, name: 'Gouda' },
        },
        '456': {
          type: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: QueryRootId, path: ['foo'] }],
          data: { id: 456, name: 'Brie' },
        },
      });
    });

  });
});
