import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../src/nodes';
import { restore } from '../../../../src/operations';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
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
      }, cacheContext);
    });

    it(`restores GraphSnapshot from JSON serializable object`, () => {
      expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
    });

    it(`correctly restores different types of NodeSnapshot`, () => {
      expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('1')).to.be.an.instanceOf(EntitySnapshot);
      expect(restoreGraphSnapshot.getNodeSnapshot('2')).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`restores RootQuery GraphSnapshot from JSON serialization object`, () => {
      const rootGraphSnapshot = restoreGraphSnapshot.getNodeSnapshot(QueryRootId)!;
      const rootData = restoreGraphSnapshot.getNodeData(QueryRootId);

      const fooData = restoreGraphSnapshot.getNodeData('1');

      expect(rootGraphSnapshot.inbound).to.eq(undefined);
      expect(rootGraphSnapshot.outbound).to.have.deep.members([{ id: '1', path: ['foo'] }]);
      expect(rootData.foo).to.eq(fooData);
    });

    it(`restores id='1' GraphSnapshot from JSON serialization object`, () => {
      const fooGraphSnapshot = restoreGraphSnapshot.getNodeSnapshot('1')!;
      const fooData = restoreGraphSnapshot.getNodeData('1');
      const barData = restoreGraphSnapshot.getNodeData('2');

      expect(fooGraphSnapshot.inbound).to.have.deep.members([
        { id: QueryRootId, path: ['foo'] },
        { id: '2', path: ['fizz'] },
      ]);
      expect(fooGraphSnapshot.outbound).to.have.deep.members([{ id: '2', path: ['bar'] }]);
      expect(fooData.id).to.eq(1);
      expect(fooData.name).to.eq('Foo');
      expect(fooData.bar).to.eq(barData);
    });

    it(`restores id='2' GraphSnapshot from JSON serialization object`, () => {
      const barGraphSnapshot = restoreGraphSnapshot.getNodeSnapshot('2')!;
      const fooData = restoreGraphSnapshot.getNodeData('1');
      const barData = restoreGraphSnapshot.getNodeData('2');

      expect(barGraphSnapshot.inbound).to.have.deep.members([
        { id: '1', path: ['bar'] },
        { id: '2', path: ['buzz'] },
      ]);
      expect(barGraphSnapshot.outbound).to.have.deep.members([
        { id: '1', path: ['fizz'] },
        { id: '2', path: ['buzz'] },
      ]);
      expect(barData.id).to.eq(2);
      expect(barData.name).to.eq('Bar');
      expect(barData.fizz).to.eq(fooData);
      expect(barData.buzz).to.eq(barData);
    });

  });
});
