import { CacheContext } from '../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { extract, prune } from '../../../../src/operations';
import { Serializable, StaticNodeId } from '../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext, query } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.prune`, () => {
  let cacheContext: CacheContext;
  let snapshot: GraphSnapshot;
  let extractResult: Serializable.GraphSnapshot;
  beforeAll(() => {
    cacheContext = createStrictCacheContext();
    snapshot = createGraphSnapshot(
      {
        foo: {
          id: 1,
          name: 'Foo',
          bar: {
            id: 2,
            name: 'Bar',
            fizz: { id: 1 },
            buzz: { id: 2 },
          },
        },
      },
      `{
        foo {
          id
          name
          bar {
            id
            name
            fizz { id }
            buzz { id }
          }
        }
      }`,
      cacheContext
    );
  });

  it(`prunes value from cyclic graph correctly`, () => {
    // prune field `name` out of `bar`
    const pruneQuery = query(`{
      foo {
        id
        name
        bar {
          id
          fizz { id }
          buzz { id }
        }
      }
    }`);
    const pruned = prune(cacheContext, snapshot, pruneQuery);
    extractResult = extract(pruned.snapshot, cacheContext);
    expect(extractResult).toEqual({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        outbound: [{ id: '1', path: ['foo'] }],
        data: {
          foo: undefined,
        },
      },
      '1': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [
          { id: QueryRootId, path: ['foo'] },
          { id: '2', path: ['fizz'] },
        ],
        outbound: [
          { id: '2', path: ['bar'] },
        ],
        data: {
          id: 1,
          name: 'Foo',
          bar: undefined,
        },
      },
      '2': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [
          { id: '1', path: ['bar'] },
          { id: '2', path: ['buzz'] },
        ],
        outbound: [
          { id: '1', path: ['fizz'] },
          { id: '2', path: ['buzz'] },
        ],
        data: {
          id: 2,
          fizz: undefined,
          buzz: undefined,
        },
      },
    });
  });

  it(`prunes reference from cyclic graph correctly`, () => {
    // prune field 'fizz' out of `bar`
    const pruneQuery = query(`{
      foo {
        id
        name
        bar {
          id
          name
          buzz { id }
        }
      }
    }`);
    const pruned = prune(cacheContext, snapshot, pruneQuery);
    extractResult = extract(pruned.snapshot, cacheContext);
    expect(extractResult).toEqual({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        outbound: [{ id: '1', path: ['foo'] }],
        data: {
          foo: undefined,
        },
      },
      '1': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [
          { id: QueryRootId, path: ['foo'] },
        ],
        outbound: [
          { id: '2', path: ['bar'] },
        ],
        data: {
          id: 1,
          name: 'Foo',
          bar: undefined,
        },
      },
      '2': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [
          { id: '1', path: ['bar'] },
          { id: '2', path: ['buzz'] },
        ],
        outbound: [
          { id: '2', path: ['buzz'] },
        ],
        data: {
          id: 2,
          name: 'Bar',
          buzz: undefined,
        },
      },
    });
  });

});
