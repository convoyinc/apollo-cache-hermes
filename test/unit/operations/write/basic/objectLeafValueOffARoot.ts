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
  describe(`object leaf-value hanging off a root`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const result = createSnapshot(
        {
          foo: {},
          bar: {
            value: 'this is a bar',
            extraProp: {
              prop1: 100,
              prop2: 200,
            },
            extraProp1: {
              prop0: 'hello',
            },
          },
        },
        `{ foo bar }`
      );

      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`creates the query root, with the values`, () => {
      expect(snapshot.getNodeData(QueryRootId)).toEqual({
        foo: {},
        bar: {
          value: 'this is a bar',
          extraProp: {
            prop1: 100,
            prop2: 200,
          },
          extraProp1: {
            prop0: 'hello',
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
