import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../src/nodes';
import { restore } from '../../../../src/operations';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`duplicate GraphSnapshot`, () => {

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      originalGraphSnapshot = createGraphSnapshot(
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

      restoreGraphSnapshot = restore({
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
      }, cacheContext).cacheSnapshot.baseline;
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('1')).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('a')).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('b')).to.be.an.instanceOf(EntitySnapshot);
    });

  });
});
