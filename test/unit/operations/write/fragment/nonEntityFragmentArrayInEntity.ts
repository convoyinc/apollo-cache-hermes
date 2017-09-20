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
  const viewerQuery = query(`
    query getViewer {
      viewer {
        id
        name
        articles {
          ...ShortArticle
        } 
      }
    }
    fragment ShortArticle on Article {
      createAt
      title
    }
  `);

  describe(`write a new single entity with fragment in query`, () => {
    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const result = write(context, empty, viewerQuery, {
        viewer: {
          id: 123,
          name: 'Gouda',
          articles: [
            {
              createAt: '10/01',
              title: 'Hello',
            },
            {
              createAt: '10/02',
              title: 'World',
            },
          ],
        },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`creates the query root, referencing the entity`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({
        viewer: {
          id: 123,
          name: 'Gouda',
          articles: [
            {
              createAt: '10/01',
              title: 'Hello',
            },
            {
              createAt: '10/02',
              title: 'World',
            },
          ],
        },
      });
    });

    it(`indexes the entity`, () => {
      expect(snapshot.get('123')).to.deep.eq({
        id: 123,
        name: 'Gouda',
        articles: [
          {
            createAt: '10/01',
            title: 'Hello',
          },
          {
            createAt: '10/02',
            title: 'World',
          },
        ],
      });
    });

    it(`emits the root as an EntitySnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`emits the entity as an EntitySnapshot`, () => {
      expect(snapshot.getNodeSnapshot('123')).to.be.an.instanceOf(EntitySnapshot);
    });

    it(`directly references viewer from the query root`, () => {
      const queryRoot = snapshot.get(QueryRootId);
      const viewer = snapshot.get('123');
      expect(queryRoot.viewer).to.eq(viewer);
    });

    it(`records the outbound reference from the query root`, () => {
      const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
      expect(queryRoot.outbound).to.deep.eq([{ id: '123', path: ['viewer'] }]);
      expect(queryRoot.inbound).to.eq(undefined);
    });

    it(`records the inbound reference from referenced entity`, () => {
      const queryRoot = snapshot.getNodeSnapshot('123')!;
      expect(queryRoot.inbound).to.deep.eq([{ id: QueryRootId, path: ['viewer'] }]);
      expect(queryRoot.outbound).to.eq(undefined);
    });

    it(`marks the entity and root as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '123']);
    });

    it(`only contains the two nodes`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '123']);
    });
  });

});
