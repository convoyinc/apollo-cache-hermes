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
  describe(`new array of references hanging off of a root`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const result = createSnapshot(
        {
          viewer: [
            {
              id: 123,
              name: 'Gouda',
            },
            {
              id: 456,
              name: 'Brie',
            },
          ],
        },
        `{ viewer { id name } }`
      );

      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`creates the query root, referencing the entity`, () => {
      jestExpect(snapshot.getNodeData(QueryRootId)).toEqual({
        viewer: [
          {
            id: 123,
            name: 'Gouda',
          },
          {
            id: 456,
            name: 'Brie',
          },
        ],
      });
    });

    it(`indexes the first entity in an array`, () => {
      jestExpect(snapshot.getNodeData('123')).toEqual({
        id: 123,
        name: 'Gouda',
      });
    });

    it(`indexes the second entity in an array`, () => {
      jestExpect(snapshot.getNodeData('456')).toEqual({
        id: 456,
        name: 'Brie',
      });
    });

    it(`emits the root as an EntitySnapshot`, () => {
      jestExpect(snapshot.getNodeSnapshot(QueryRootId)).toBeInstanceOf(EntitySnapshot);
    });

    it(`emits the first entity as an EntitySnapshot`, () => {
      jestExpect(snapshot.getNodeSnapshot('123')).toBeInstanceOf(EntitySnapshot);
    });

    it(`emits the second entity as an EntitySnapshot`, () => {
      jestExpect(snapshot.getNodeSnapshot('456')).toBeInstanceOf(EntitySnapshot);
    });

    it(`directly references a first entity of viewer from the query root`, () => {
      const queryRoot = snapshot.getNodeData(QueryRootId);
      const viewer = snapshot.getNodeData('123');
      jestExpect(queryRoot.viewer[0]).toBe(viewer);
    });

    it(`records the outbound and inbound reference from the query root`, () => {
      const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
      jestExpect(queryRoot.outbound).toEqual([{ id: '123', path: ['viewer', 0] }, { id: '456', path: ['viewer', 1] }]);
      jestExpect(queryRoot.inbound).toBe(undefined);
    });

    it(`records the inbound and outbound reference from referenced entity`, () => {
      const queryRoot = snapshot.getNodeSnapshot('123')!;
      jestExpect(queryRoot.inbound).toEqual([{ id: QueryRootId, path: ['viewer', 0] }]);
      jestExpect(queryRoot.outbound).toBe(undefined);
    });

    it(`marks two entity in an array and root as edited`, () => {
      jestExpect(Array.from(editedNodeIds)).toEqual([QueryRootId, '123', '456']);
    });

    it(`only contains the three nodes`, () => {
      jestExpect(snapshot.allNodeIds().sort()).toEqual([QueryRootId, '123', '456'].sort());
    });
  });

});
