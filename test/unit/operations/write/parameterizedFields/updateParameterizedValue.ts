import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { ParameterizedValueSnapshot } from '../../../../../src/nodes';
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

  describe(`updates parameterized value`, () => {

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
    beforeAll(() => {
      const parameterizedQuery = query(`query getAFoo($id: ID!) {
        foo(id: $id, withExtra: true) {
          name extra
        }
      }`, { id: 1 });

      parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

      const baselineResult = write(context, empty, parameterizedQuery, {
        foo: {
          name: 'Foo',
          extra: false,
        },
      });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, parameterizedQuery, {
        foo: {
          name: 'Foo Bar',
          extra: false,
        },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`updates the node for the field`, () => {
      jestExpect(snapshot.getNodeData(parameterizedId)).toEqual({ name: 'Foo Bar', extra: false });
    });

    it(`marks only the field as edited`, () => {
      jestExpect(Array.from(editedNodeIds)).toEqual([parameterizedId]);
    });

    it(`emits a ParameterizedValueSnapshot`, () => {
      jestExpect(snapshot.getNodeSnapshot(parameterizedId)).toBeInstanceOf(ParameterizedValueSnapshot);
    });

  });
});
