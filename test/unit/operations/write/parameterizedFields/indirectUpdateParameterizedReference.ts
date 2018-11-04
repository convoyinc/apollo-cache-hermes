import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { write } from '../../../../../src/operations/write';
import { NodeId, StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`indirectly updates parameterized reference`, () => {

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
    beforeAll(() => {
      const viewerQuery = query(`{
        viewer {
          id
          name
        }
      }`);

      const parameterizedQuery = query(`query getAFoo($id: ID!) {
        foo(id: $id, withExtra: true) {
          id name extra
        }
      }`, { id: 1 });

      parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

      const baselineResult = write(context, empty, parameterizedQuery, {
        foo: {
          id: 1,
          name: 'Foo',
          extra: false,
        },
      });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, viewerQuery, {
        viewer: {
          id: 1,
          name: 'Foo Bar',
        },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`updates the node for the field`, () => {
      jestExpect(snapshot.getNodeData(parameterizedId)).toEqual({ id: 1, name: 'Foo Bar', extra: false });
    });

    it(`ensures normalized references`, () => {
      const entity = snapshot.getNodeData('1');
      jestExpect(snapshot.getNodeData(QueryRootId).viewer).toBe(entity);
      jestExpect(snapshot.getNodeData(parameterizedId)).toBe(entity);
    });

    it(`marks only the entity as edited`, () => {
      jestExpect(Array.from(editedNodeIds).sort()).toEqual(jestExpect.arrayContaining([QueryRootId, '1']));
    });

  });
});
