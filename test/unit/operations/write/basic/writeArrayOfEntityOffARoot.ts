import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
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
  const viewerQuery = query(`{
    viewer {
      id
      name
    }
  }`);

  describe(`write a new array of entity hanging off of a root`, () => {
    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const result = write(context, empty, viewerQuery, {
        viewer: [
          {
            id: 123,
            name: 'Gouda'
          },
          {
            id: 456,
            name: 'Brie'
          },
        ],
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`creates the query root, referencing the entity`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({
        viewer: [
          {
            id: 123,
            name: 'Gouda'
          },
          {
            id: 456,
            name: 'Brie'
          },
        ],
      });
    });

    it(`indexes the first entity in an array`, () => {
      expect(snapshot.get('123')).to.deep.eq({
        id: 123,
        name: 'Gouda',
      });
    });

    it(`indexes the second entity in an array`, () => {
      expect(snapshot.get('456')).to.deep.eq({
        id: 456,
        name: 'Brie',
      });
    });

    it(`emits the root as an EntitySnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`emits the first entity as an EntitySnapshot`, () => {
      expect(snapshot.getNodeSnapshot('123')).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`emits the second entity as an EntitySnapshot`, () => {
      expect(snapshot.getNodeSnapshot('456')).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`directly references a first entity of viewer from the query root`, () => {
      const queryRoot = snapshot.get(QueryRootId);
      const viewer = snapshot.get('123');
      expect(queryRoot.viewer[0]).to.eq(viewer);
    });

    it(`records the outbound and inbound reference from the query root`, () => {
      const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
      expect(queryRoot.outbound).to.deep.eq([ { id: '123', path: ['viewer', 0] }, { id: '456', path: ['viewer', 1] } ]);
      expect(queryRoot.inbound).to.eq(undefined);
    });

    it(`records the inbound and outbound reference from referenced entity`, () => {
      const queryRoot = snapshot.getNodeSnapshot('123')!;
      expect(queryRoot.inbound).to.deep.eq([{ id: QueryRootId, path: ['viewer', 0] }]);
      expect(queryRoot.outbound).to.eq(undefined);
    });

    it(`marks two entity in an array and root as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '123', '456']);
    });

    it(`only contains the three nodes`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '123', '456']);
    });
  });

});
