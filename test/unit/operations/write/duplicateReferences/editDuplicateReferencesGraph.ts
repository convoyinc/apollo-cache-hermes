import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { write } from '../../../../../src/operations/write';
import { StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const listQuery = query(`{
    foo {
      id
      bar { id }
    }
    baz {
      id
      bar { id }
    }
  }`);

  describe(`edit duplicate-references graph`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      const { snapshot: baseSnapshot } = write(context, empty, listQuery, {
        foo: [
          { id: 'a', bar: { id: 1 } },
          { id: 'a', bar: { id: 1 } },
          { id: 'b', bar: { id: 1 } },
          { id: 'a', bar: { id: 1 } },
          { id: 'b', bar: { id: 1 } },
        ],
        baz: {
          id: 'a', bar: { id: 1 },
        },
      });

      const result = write(context, baseSnapshot, listQuery, {
        foo: [
          { id: 'a', bar: { id: 2 } },
          { id: 'a', bar: { id: 2 } },
          { id: 'b', bar: null },
          { id: 'a', bar: { id: 2 } },
          { id: 'b', bar: null },
        ],
        baz: {
          id: 'a', bar: { id: 2 },
        },
      });
      snapshot = result.snapshot;
    });

    it(`writes the complete graph`, () => {
      expect(snapshot.getNodeData(QueryRootId)).toEqual({
        foo: [
          { id: 'a', bar: { id: 2 } },
          { id: 'a', bar: { id: 2 } },
          { id: 'b', bar: null },
          { id: 'a', bar: { id: 2 } },
          { id: 'b', bar: null },
        ],
        baz: {
          id: 'a', bar: { id: 2 },
        },
      });
    });

    it(`doesn't insert duplicate outbound references`, () => {
      expect(snapshot.getNodeSnapshot('a')!.outbound).toEqual([
        { id: '2', path: ['bar'] },
      ]);
      expect(snapshot.getNodeSnapshot('b')!.outbound).toBe(undefined);
    });

    it(`removes unreferenced nodes`, () => {
      expect(snapshot.getNodeSnapshot('1')).toBe(undefined);
    });

    it(`doesn't insert duplicate inbound references for targets`, () => {
      expect(snapshot.getNodeSnapshot('2')!.inbound).toEqual([
        { id: 'a', path: ['bar'] },
      ]);
    });
  });
});
