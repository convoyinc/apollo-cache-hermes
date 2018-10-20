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
        viewer: [
          {
            id: 123,
            name: 'Gouda',
          },
          {
            id: 456,
            name: 'Brie',
          },
          null,
        ],
      },
      `{ viewer { id name } }`,
      cacheContext
    );

    const pruneQuery = query(`{ viewer { id }}`);
    const pruned = prune(cacheContext, snapshot, pruneQuery);
    extractResult = extract(pruned.snapshot, cacheContext);
  });

  // `entities referenced by an array of references at the root`

  it(`prunes fields from entities referenced by an array at the root correctly`, () => {
    expect(extractResult).toEqual({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        outbound: [
          { id: '123', path: ['viewer', 0] },
          { id: '456', path: ['viewer', 1] },
        ],
        data: {
          viewer: [undefined, undefined, null],
        },
      },
      '123': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: QueryRootId, path: ['viewer', 0] }],
        data: { id: 123 },
      },
      '456': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: QueryRootId, path: ['viewer', 1] }],
        data: { id: 456 },
      },
    });
  });

});
