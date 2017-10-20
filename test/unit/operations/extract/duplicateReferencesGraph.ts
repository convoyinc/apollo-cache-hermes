import { extract } from '../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../src/schema';
import { createSnapshot } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`duplicate GraphSnapshot`, () => {

    let extractResult: Serializable.GraphSnapshot;
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
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: 'a', path: ['foo', 0] },
            { id: 'a', path: ['foo', 1] },
            { id: 'b', path: ['foo', 2] },
            { id: 'a', path: ['foo', 3] },
            { id: 'b', path: ['foo', 4] },
            { id: 'a', path: ['baz'] },
          ],
          data: {
            foo: [],
          },
        },
        '1': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [
            { id: 'a', path: ['bar'] },
            { id: 'b', path: ['bar'] },
          ],
          data: { id: 1 },
        },
        'a': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [
            { id: QueryRootId, path: ['foo', 0] },
            { id: QueryRootId, path: ['foo', 1] },
            { id: QueryRootId, path: ['foo', 3] },
            { id: QueryRootId, path: ['baz'] },
          ],
          outbound: [{ id: '1', path: ['bar'] }],
          data: {
            id: 'a',
          },
        },
        'b': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [
            { id: QueryRootId, path: ['foo', 2] },
            { id: QueryRootId, path: ['foo', 4] },
          ],
          outbound: [{ id: '1', path: ['bar'] }],
          data: {
            id: 'b',
          },
        },
      });
    });

  });
});
