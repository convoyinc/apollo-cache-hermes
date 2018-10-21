import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`simple leaf-values hanging off a root`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      const result = createSnapshot(
        {
          rows: [
            [
              { id: 'a', value: 1 },
              { id: 'b', value: 2 },
            ],
            [
              { id: 'c', value: 3 },
              { id: 'd', value: 4 },
            ],
          ],
        },
        `{
          rows {
            id
            value
          }
        }`
      );
      snapshot = result.snapshot;
    });

    it(`creates the query root, with the values`, () => {
      expect(snapshot.getNodeData(QueryRootId)).toEqual({
        rows: [
          [
            { id: 'a', value: 1 },
            { id: 'b', value: 2 },
          ],
          [
            { id: 'c', value: 3 },
            { id: 'd', value: 4 },
          ],
        ],
      });
    });

    it(`creates entity node in each row`, () => {
      expect(snapshot.getNodeData('a')).toEqual({ id: 'a', value: 1 });
      expect(snapshot.getNodeData('b')).toEqual({ id: 'b', value: 2 });
      expect(snapshot.getNodeData('c')).toEqual({ id: 'c', value: 3 });
      expect(snapshot.getNodeData('d')).toEqual({ id: 'd', value: 4 });
    });

    it(`records the outbound references from the query root`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)!.outbound).toEqual([
        { id: 'a', path: ['rows', 0, 0] },
        { id: 'b', path: ['rows', 0, 1] },
        { id: 'c', path: ['rows', 1, 0] },
        { id: 'd', path: ['rows', 1, 1] },
      ]);
    });

    it(`directly reference each row from the query root`, () => {
      const rows = snapshot.getNodeData(QueryRootId).rows;
      expect(rows[0][0]).toBe(snapshot.getNodeData('a'));
      expect(rows[0][1]).toBe(snapshot.getNodeData('b'));
      expect(rows[1][0]).toBe(snapshot.getNodeData('c'));
      expect(rows[1][1]).toBe(snapshot.getNodeData('d'));
    });

  });

});
