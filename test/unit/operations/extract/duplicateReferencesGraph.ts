import { extract } from '../../../../src/operations/extract';
import { Serializeable } from '../../../../src/primitive';
import { StaticNodeId } from '../../../../src/schema';
import { createSnapshot } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`duplicate GraphSnapshot`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          foo: [
            { id: 'a', bar: { id: 1 } },
            { id: 'a', bar: { id: 1 } },
            { id: 'b', bar: { id: 1 } },
            { id: 'a', bar: { id: 1 } },
            { id: 'b', bar: { id: 1 } },
          ],
          baz: {
            id: 'a', bar: { id: 1 },
          },
        },
        `{
          foo {
            id
            bar { id }
          }
          baz {
            id
            bar { id }
          }
        }`
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extracts JSON serialization object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: 'a', path: ['foo', 0] },
            { id: 'a', path: ['foo', 1] },
            { id: 'b', path: ['foo', 2] },
            { id: 'a', path: ['foo', 3] },
            { id: 'b', path: ['foo', 4] },
            { id: 'a', path: ['baz'] },
          ],
          data: {},
        },
        '1': {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [
            { id: 'a', path: ['bar'] },
            { id: 'b', path: ['bar'] },
          ],
          data: { id: 1 },
        },
        'a': {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [
            { id: QueryRootId, path: ['foo', 0] },
            { id: QueryRootId, path: ['foo', 1] },
            { id: QueryRootId, path: ['foo', 3] },
            { id: QueryRootId, path: ['baz'] },
          ],
          outbound: [{ id: 1, path: ['bar'] }],
          data: {
            id: 'a',
          },
        },
        'b': {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [
            { id: QueryRootId, path: ['foo', 2] },
            { id: QueryRootId, path: ['foo', 4] },
            { id: QueryRootId, path: ['baz'] },
          ],
          outbound: [{ id: 1, path: ['bar'] }],
          data: {
            id: 'b',
          },
        },
      });
    });

  });
});
