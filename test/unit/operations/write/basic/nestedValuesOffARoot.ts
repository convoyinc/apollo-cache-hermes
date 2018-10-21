import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { NodeId, StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`nested values hanging off of a root`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const result = createSnapshot(
        {
          bar: {
            value: 42,
            prop1: 'hello',
            prop2: {
              nestedProp1: 1000,
              nestedProp2: 'world',
            },
          },
        },
        `{
          bar {
            value
            prop1
            prop2
          }
        }`
      );

      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`creates the query root, with the values`, () => {
      expect(snapshot.getNodeData(QueryRootId)).toEqual({
        bar: {
          value: 42,
          prop1: 'hello',
          prop2: {
            nestedProp1: 1000,
            nestedProp2: 'world',
          },
        },
      });
    });

    it(`marks the root as edited`, () => {
      expect(Array.from(editedNodeIds)).toEqual([QueryRootId]);
    });

    it(`only contains the root node`, () => {
      expect(snapshot.allNodeIds()).toEqual([QueryRootId]);
    });

    it(`emits the root as an EntitySnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).toBeInstanceOf(EntitySnapshot);
    });
  });

});
