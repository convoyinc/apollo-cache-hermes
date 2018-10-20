import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { write } from '../../../../../src/operations/write';
import { NodeId, RawOperation, StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`nested parameterized references in an array`, () => {

    let nestedQuery: RawOperation, snapshot: GraphSnapshot, containerId: NodeId;
    beforeAll(() => {
      nestedQuery = query(`
        query nested($id: ID!) {
          one {
            two(id: $id) {
              three { id }
            }
          }
        }`, { id: 1 });

      containerId = nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });

      snapshot = write(context, empty, nestedQuery, {
        one: {
          two: [
            { three: { id: 1 } },
            { three: { id: 2 } },
          ],
        },
      }).snapshot;
    });

    it(`writes a value snapshot for the containing field`, () => {
      expect(snapshot.getNodeSnapshot(containerId)).toBeDefined;
    });

    it(`writes value snapshots for each array entry`, () => {
      expect(snapshot.getNodeSnapshot('1')).toBeDefined;
      expect(snapshot.getNodeSnapshot('2')).toBeDefined;
    });

    it(`references the parent snapshot from the children`, () => {
      const entry1 = snapshot.getNodeSnapshot('1')!;
      const entry2 = snapshot.getNodeSnapshot('2')!;

      expect(entry1.inbound).toEqual([{ id: containerId, path: [0, 'three'] }]);
      expect(entry2.inbound).toEqual([{ id: containerId, path: [1, 'three'] }]);
    });

    it(`references the children from the parent`, () => {
      const container = snapshot.getNodeSnapshot(containerId)!;

      expect(container.outbound).toEqual([
        { id: '1', path: [0, 'three'] },
        { id: '2', path: [1, 'three'] },
      ]);
    });

    it(`allows shifting from the front`, () => {
      const updated = write(context, snapshot, nestedQuery, {
        one: {
          two: [
            { three: { id: 2 } },
          ],
        },
      }).snapshot;

      expect(updated.getNodeSnapshot(containerId)!.outbound).toEqual([
        { id: '2', path: [0, 'three'] },
      ]);

      expect(updated.getNodeSnapshot('2')!.inbound).toEqual([
        { id: containerId, path: [0, 'three'] },
      ]);
    });

  });
});
