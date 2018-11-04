import { extract } from '../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`duplicate GraphSnapshot`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
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
        }`,
        cacheContext
      );

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serialization object`, () => {
      jestExpect(extractResult).toEqual({
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
            foo: [undefined, undefined, undefined, undefined, undefined],
            baz: undefined,
          },
        },
        '1': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [
            { id: 'a', path: ['bar'] },
            { id: 'b', path: ['bar'] },
          ],
          data: {
            id: 1,
          },
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
            bar: undefined,
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
            bar: undefined,
          },
        },
      });
    });

  });
});
