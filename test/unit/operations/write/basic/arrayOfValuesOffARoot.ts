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
      postal
      name
    }
  }`);

  describe(`array of values hanging off of a root`, () => {
    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const result = write(context, empty, viewerQuery, {
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
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`creates the query root, referencing the entity`, () => {
      expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
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
      expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`directly references a first entity of viewer from the query root`, () => {
      const queryRoot = snapshot.getNodeData(QueryRootId);
      expect(queryRoot.viewer[0]).to.deep.eq({
        postal: 123,
        name: 'Gouda',
      });
    });

    it(`records the outbound and inbound reference from the query root`, () => {
      const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
      expect(queryRoot.outbound).to.eq(undefined);
      expect(queryRoot.inbound).to.eq(undefined);
    });

    it(`marks a query root as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
    });

    it(`only contains a one node`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
    });
  });

});
