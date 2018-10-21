import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../src/nodes';
import { restore } from '../../../../src/operations';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`cyclic GraphSnapshot`, () => {

    let restoreGraphSnapshot: GraphSnapshot, originalGraphSnapshot: GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      originalGraphSnapshot = createGraphSnapshot(
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

      restoreGraphSnapshot = restore({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: '1', path: ['foo'] }],
          data: {},
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
          data: { id: 1, name: 'Foo' },
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
          data: { id: 2, name: 'Bar' },
        },
      }, cacheContext).cacheSnapshot.baseline;
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).toEqual(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).toBeInstanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('1')).toBeInstanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('2')).toBeInstanceOf(EntitySnapshot);
    });

    it(`restores RootQuery GraphSnapshot from JSON serialization object`, () => {
      const rootGraphSnapshot = restoreGraphSnapshot.getNodeSnapshot(QueryRootId)!;
      const rootData = restoreGraphSnapshot.getNodeData(QueryRootId);

      const fooData = restoreGraphSnapshot.getNodeData('1');

      expect(rootGraphSnapshot.inbound).toBe(undefined);
      expect(rootGraphSnapshot.outbound).toEqual([{ id: '1', path: ['foo'] }]);
      expect(rootData.foo).toBe(fooData);
    });

    it(`restores id='1' GraphSnapshot from JSON serialization object`, () => {
      const fooGraphSnapshot = restoreGraphSnapshot.getNodeSnapshot('1')!;
      const fooData = restoreGraphSnapshot.getNodeData('1');
      const barData = restoreGraphSnapshot.getNodeData('2');

      expect(fooGraphSnapshot.inbound).toEqual([
        { id: QueryRootId, path: ['foo'] },
        { id: '2', path: ['fizz'] },
      ]);
      expect(fooGraphSnapshot.outbound).toEqual([{ id: '2', path: ['bar'] }]);
      expect(fooData.id).toBe(1);
      expect(fooData.name).toBe('Foo');
      expect(fooData.bar).toBe(barData);
    });

    it(`restores id='2' GraphSnapshot from JSON serialization object`, () => {
      const barGraphSnapshot = restoreGraphSnapshot.getNodeSnapshot('2')!;
      const fooData = restoreGraphSnapshot.getNodeData('1');
      const barData = restoreGraphSnapshot.getNodeData('2');

      expect(barGraphSnapshot.inbound).toEqual([
        { id: '1', path: ['bar'] },
        { id: '2', path: ['buzz'] },
      ]);
      expect(barGraphSnapshot.outbound).toEqual([
        { id: '1', path: ['fizz'] },
        { id: '2', path: ['buzz'] },
      ]);
      expect(barData.id).toBe(2);
      expect(barData.name).toBe('Bar');
      expect(barData.fizz).toBe(fooData);
      expect(barData.buzz).toBe(barData);
    });

  });
});
