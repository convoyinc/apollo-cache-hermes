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
  describe(`array of values hanging off of a root`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const result = createSnapshot(
        {
          viewer: [
            {
              postal: 123,
              name: 'Gouda',
            },
            {
              postal: 456,
              name: 'Brie',
            },
          ],
        },
        `{ viewer { postal name } }`
      );
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`creates the query root, referencing the entity`, () => {
      jestExpect(snapshot.getNodeData(QueryRootId)).toEqual({
        viewer: [
          {
            postal: 123,
            name: 'Gouda',
          },
          {
            postal: 456,
            name: 'Brie',
          },
        ],
      });
    });

    it(`emits the root as an EntitySnapshot`, () => {
      jestExpect(snapshot.getNodeSnapshot(QueryRootId)).toBeInstanceOf(EntitySnapshot);
    });

    it(`directly references a first entity of viewer from the query root`, () => {
      const queryRoot = snapshot.getNodeData(QueryRootId);
      jestExpect(queryRoot.viewer[0]).toEqual({
        postal: 123,
        name: 'Gouda',
      });
    });

    it(`records the outbound and inbound reference from the query root`, () => {
      const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
      jestExpect(queryRoot.outbound).toBe(undefined);
      jestExpect(queryRoot.inbound).toBe(undefined);
    });

    it(`marks a query root as edited`, () => {
      jestExpect(Array.from(editedNodeIds)).toEqual(jestExpect.arrayContaining([QueryRootId]));
    });

    it(`only contains a one node`, () => {
      jestExpect(snapshot.allNodeIds()).toEqual(jestExpect.arrayContaining([QueryRootId]));
    });
  });

});
