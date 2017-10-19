import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { extract, restore } from '../../../../src/operations';
import { StaticNodeId } from '../../../../src/schema';
import { createSnapshot } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`cyclic GraphSnapshot`, () => {

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
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
        }`
      ).snapshot;

      restoreResult = restore(extract(snapshot));
    });

    it(`restores RootQuery GraphSnapshot from JSON serialization object`, () => {
      const rootGraphSnapshot = restoreResult.getNodeSnapshot(QueryRootId)!;
      const rootData = restoreResult.getNodeData(QueryRootId);

      const fooData = restoreResult.getNodeData('1');

      expect(rootGraphSnapshot.inbound).to.eq(undefined);
      expect(rootGraphSnapshot.outbound).to.have.members([{ id: 1, path: ['foo'] }]);
      expect(rootData.foo).to.eq(fooData);
    });

    it(`restores id='1' GraphSnapshot from JSON serialization object`, () => {
      const fooGraphSnapshot = restoreResult.getNodeSnapshot('1')!;
      const fooData = restoreResult.getNodeData('1');
      const barData = restoreResult.getNodeData('2');

      expect(fooGraphSnapshot.inbound).to.eq([
        { id: QueryRootId, path: ['foo'] },
        { id: 2, path: ['fizz'] },
      ]);
      expect(fooGraphSnapshot.outbound).to.eq([{ id: 2, path: ['bar'] }]);
      expect(fooData.id).to.eq('1');
      expect(fooData.name).to.eq('Foo');
      expect(fooData.bar).to.eq(barData);
    });

    it(`restores id='2' GraphSnapshot from JSON serialization object`, () => {
      const barGraphSnapshot = restoreResult.getNodeSnapshot('2')!;
      const fooData = restoreResult.getNodeData('1');
      const barData = restoreResult.getNodeData('2');

      expect(barGraphSnapshot.inbound).to.eq([
        { id: 1, path: ['bar'] },
        { id: 2, path: ['buzz'] },
      ]);
      expect(barGraphSnapshot.outbound).to.eq([
        { id: 1, path: ['fizz'] },
        { id: 2, path: ['buzz'] },
      ]);
      expect(barData.id).to.eq('2');
      expect(barData.name).to.eq('Bar');
      expect(barData.fizz).to.eq(fooData);
      expect(barData.buzz).to.eq(barData);
    });

  });
});
