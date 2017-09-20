import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { read, write } from '../../../../src/operations';
import { Query, StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.read`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const viewerQuery = query(`{
    viewer {
      id
      name
    }
  }`);

  describe(`with an empty cache`, () => {

    it(`returns undefined when fetching anything.`, () => {
      expect(read(context, viewerQuery, empty).result).to.eq(undefined);
    });

    it(`is marked incomplete`, () => {
      expect(read(context, viewerQuery, empty).complete).to.eq(false);
    });

    it(`includes no node ids if requested`, () => {
      expect(Array.from(read(context, viewerQuery, empty, true).nodeIds)).to.have.members([]);
    });

  });

  describe(`with a complete cache`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      snapshot = write(context, empty, viewerQuery, {
        viewer: {
          id: 123,
          name: 'Foo Bar',
        },
      }).snapshot;
    });

    it(`returns the selected values.`, () => {
      const { result } = read(context, viewerQuery, snapshot);
      expect(result).to.deep.eq({
        viewer: {
          id: 123,
          name: 'Foo Bar',
        },
      });
    });

    it(`is marked complete`, () => {
      const { complete } = read(context, viewerQuery, snapshot);
      expect(complete).to.eq(true);
    });

    it(`includes all related node ids, if requested`, () => {
      const { nodeIds } = read(context, viewerQuery, snapshot, true);
      expect(Array.from(nodeIds)).to.have.members([QueryRootId, '123']);
    });

  });

  describe(`with a partial cache`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      snapshot = write(context, empty, viewerQuery, {
        viewer: {
          id: 123,
        },
      }).snapshot;
    });

    it(`returns the selected values.`, () => {
      const { result } = read(context, viewerQuery, snapshot);
      expect(result).to.deep.eq({
        viewer: {
          id: 123,
          name: null,
        },
      });
    });

    it(`is marked incomplete`, () => {
      const { complete } = read(context, viewerQuery, snapshot);
      expect(complete).to.eq(true);
    });

    it(`includes all related node ids, if requested`, () => {
      const { nodeIds } = read(context, viewerQuery, snapshot, true);
      expect(Array.from(nodeIds)).to.have.members([QueryRootId, '123']);
    });

  });

  describe(`with a null subgraphs`, () => {

    let nestedQuery: Query, snapshot: GraphSnapshot;
    beforeAll(() => {
      nestedQuery = query(`{
        one {
          two {
            three { four }
          }
          five
        }
      }`);
      snapshot = write(context, empty, nestedQuery, {
        one: {
          two: null,
          five: 'hi',
        },
      }).snapshot;
    });

    it(`returns the selected values.`, () => {
      const { result } = read(context, nestedQuery, snapshot);
      expect(result).to.deep.eq({
        one: {
          two: null,
          five: 'hi',
        },
      });
    });

    it(`is marked complete`, () => {
      const { complete } = read(context, nestedQuery, snapshot);
      expect(complete).to.eq(true);
    });

    it(`includes all related node ids, if requested`, () => {
      const { nodeIds } = read(context, nestedQuery, snapshot, true);
      expect(Array.from(nodeIds)).to.have.members([QueryRootId]);
    });

  });

  describe(`with arrays of complete values`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      snapshot = write(context, empty, viewerQuery, {
        viewer: [
          { id: 1, name: 'Foo' },
          { id: 2, name: 'Bar' },
          { id: 3, name: 'Baz' },
        ],
      }).snapshot;
    });

    it(`returns the selected values.`, () => {
      const { result } = read(context, viewerQuery, snapshot);
      expect(result).to.deep.eq({
        viewer: [
          { id: 1, name: 'Foo' },
          { id: 2, name: 'Bar' },
          { id: 3, name: 'Baz' },
        ],
      });
    });

    it(`is marked complete`, () => {
      const { complete } = read(context, viewerQuery, snapshot);
      expect(complete).to.eq(true);
    });

    it(`includes all related node ids, if requested`, () => {
      const { nodeIds } = read(context, viewerQuery, snapshot, true);
      expect(Array.from(nodeIds)).to.have.members([QueryRootId, '1', '2', '3']);
    });

  });

});
