import * as _ from 'lodash';

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

  describe(`parameterized value with optional arguments`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
    beforeAll(() => {
      const parameterizedQuery = query(
        `query getAFoo($one: Number, $two: String) {
          foo(a: $one, b:$two)
        }`, { one: 1 }
      );

      parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { a: 1, b: null });

      const result = write(context, empty, parameterizedQuery, { foo: 'hello' });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`writes a node for the field`, () => {
      jestExpect(snapshot.getNodeData(parameterizedId)).toEqual('hello');
    });

    it(`creates an outgoing reference from the field's container`, () => {
      const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
      jestExpect(queryRoot.outbound).toEqual([{ id: parameterizedId, path: ['foo'] }]);
    });

    it(`creates an inbound reference to the field's container`, () => {
      const values = snapshot.getNodeSnapshot(parameterizedId)!;
      jestExpect(values.inbound).toEqual([{ id: QueryRootId, path: ['foo'] }]);
    });

    it(`does not expose the parameterized field directly from its container`, () => {
      jestExpect(_.get(snapshot.getNodeData(QueryRootId), 'foo')).toBe(undefined);
    });

    it(`marks only the new field as edited`, () => {
      jestExpect(Array.from(editedNodeIds)).toEqual(jestExpect.arrayContaining([parameterizedId]));
    });

    it(`emits a ParameterizedValueSnapshot`, () => {
      jestExpect(snapshot.getNodeSnapshot(parameterizedId)).toBeInstanceOf(ParameterizedValueSnapshot);
    });

  });
});
