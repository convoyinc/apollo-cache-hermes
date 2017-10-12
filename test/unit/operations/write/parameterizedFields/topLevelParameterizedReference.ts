import * as _ from 'lodash';

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

  describe(`top-level parameterized reference`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
    beforeAll(() => {
      const parameterizedQuery = query(`
        query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            id name extra
          }
        }`, { id: 1 });

      parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

      const result = write(context, empty, parameterizedQuery, {
        foo: {
          id: 1,
          name: 'Foo',
          extra: false,
        },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`writes a node for the new entity`, () => {
      expect(snapshot.getNodeData('1')).to.deep.eq({ id: 1, name: 'Foo', extra: false });
    });

    it(`writes a node for the field that points to the entity's value`, () => {
      expect(snapshot.getNodeData(parameterizedId)).to.eq(snapshot.getNodeData('1'));
    });

    it(`creates an outgoing reference from the field's container`, () => {
      const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
      expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: ['foo'] }]);
    });

    it(`creates an inbound reference to the field's container`, () => {
      const values = snapshot.getNodeSnapshot(parameterizedId)!;
      expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: ['foo'] }]);
    });

    it(`creates an outgoing reference from the parameterized field to the referenced entity`, () => {
      const values = snapshot.getNodeSnapshot(parameterizedId)!;
      expect(values.outbound).to.deep.eq([{ id: '1', path: [] }]);
    });

    it(`creates an incoming reference from the parameterized field to the referenced entity`, () => {
      const entity = snapshot.getNodeSnapshot('1')!;
      expect(entity.inbound).to.deep.eq([{ id: parameterizedId, path: [] }]);
    });

    it(`does not expose the parameterized field directly from its container`, () => {
      expect(_.get(snapshot.getNodeData(QueryRootId), 'foo')).to.eq(undefined);
    });

    it(`marks the new field and entity as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([parameterizedId, '1']);
    });

  });
});
