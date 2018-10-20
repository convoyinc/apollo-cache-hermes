import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { read, write } from '../../../../src/operations';
import { RawOperation, StaticNodeId } from '../../../../src/schema';
import { query, silentConfig, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.read`, () => {

  const context = new CacheContext(strictConfig);
  const silentContext = new CacheContext(silentConfig);
  const empty = new GraphSnapshot();
  const viewerQuery = query(`{
    viewer {
      id
      name
    }
  }`);

  describe(`with an empty cache`, () => {

    it(`returns undefined when fetching anything.`, () => {
      jestExpect(read(context, viewerQuery, empty).result).toBe(undefined);
    });

    it(`is marked incomplete`, () => {
      jestExpect(read(context, viewerQuery, empty).complete).toBe(false);
    });

    it(`includes no node ids if requested`, () => {
      jestExpect(Array.from(read(context, viewerQuery, empty, true).nodeIds)).toEqual([]);
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
      jestExpect(result).toEqual({
        viewer: {
          id: 123,
          name: 'Foo Bar',
        },
      });
    });

    it(`is marked complete`, () => {
      const { complete } = read(context, viewerQuery, snapshot);
      jestExpect(complete).toBe(true);
    });

    it(`includes all related node ids, if requested`, () => {
      const { nodeIds } = read(context, viewerQuery, snapshot, true);
      jestExpect(Array.from(nodeIds)).toEqual([QueryRootId, '123']);
    });

  });

  describe(`with a partial write`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      snapshot = write(silentContext, empty, viewerQuery, {
        viewer: {
          id: 123,
        },
      }).snapshot;
    });

    it(`returns the selected values.`, () => {
      const { result } = read(silentContext, viewerQuery, snapshot);
      jestExpect(result).toEqual({
        viewer: {
          id: 123,
          name: null,
        },
      });
    });

    it(`is marked incomplete`, () => {
      const { complete } = read(silentContext, viewerQuery, snapshot);
      jestExpect(complete).toBe(true);
    });

    it(`includes all related node ids, if requested`, () => {
      const { nodeIds } = read(silentContext, viewerQuery, snapshot, true);
      jestExpect(Array.from(nodeIds)).toEqual([QueryRootId, '123']);
    });

  });

  describe(`with a null subgraphs`, () => {

    let nestedQuery: RawOperation, snapshot: GraphSnapshot;
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
      jestExpect(result).toEqual({
        one: {
          two: null,
          five: 'hi',
        },
      });
    });

    it(`is marked complete`, () => {
      const { complete } = read(context, nestedQuery, snapshot);
      jestExpect(complete).toBe(true);
    });

    it(`includes all related node ids, if requested`, () => {
      const { nodeIds } = read(context, nestedQuery, snapshot, true);
      jestExpect(Array.from(nodeIds)).toEqual([QueryRootId]);
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
      jestExpect(result).toEqual({
        viewer: [
          { id: 1, name: 'Foo' },
          { id: 2, name: 'Bar' },
          { id: 3, name: 'Baz' },
        ],
      });
    });

    it(`is marked complete`, () => {
      const { complete } = read(context, viewerQuery, snapshot);
      jestExpect(complete).toBe(true);
    });

    it(`includes all related node ids, if requested`, () => {
      const { nodeIds } = read(context, viewerQuery, snapshot, true);
      jestExpect(Array.from(nodeIds)).toEqual([QueryRootId, '1', '2', '3']);
    });

  });

});
