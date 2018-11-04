import { extract, prune } from '../../../../src/operations';
import { Serializable, StaticNodeId } from '../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext, query } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.prune`, () => {
  let extractResult: Serializable.GraphSnapshot;
  beforeAll(() => {
    const cacheContext = createStrictCacheContext();
    const snapshot = createGraphSnapshot(
      {
        foo: [
          { id: 'a', name: 'nameA', bar: { id: 1, stuff: 'payload' } },
          { id: 'a', name: 'nameA', bar: { id: 1, stuff: 'payload' } },
          { id: 'b', name: 'nameB', bar: { id: 1, stuff: 'payload' } },
          { id: 'a', name: 'nameA', bar: { id: 1, stuff: 'payload' } },
          { id: 'b', name: 'nameB', bar: { id: 1, stuff: 'payload' } },
        ],
        baz: {
          id: 'a', bar: { id: 1, stuff: 'payload' },
        },
      },
      `{
        foo {
          id
          name
          bar { id stuff }
        }
        baz {
          id
          bar { id }
        }
      }`,
      cacheContext
    );

    const pruneQuery = query(`{
      foo {
        id
        bar { id }
      }
      baz {
        id
        bar { id }
      }
    }`);
    const pruned = prune(cacheContext, snapshot, pruneQuery);
    extractResult = extract(pruned.snapshot, cacheContext);
  });

  it(`prunes value from duplicated references correctly`, () => {
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
