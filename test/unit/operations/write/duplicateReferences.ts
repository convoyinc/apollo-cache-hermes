import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { write } from '../../../../src/operations/write';
import { StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

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

  describe(`payloads with duplicate references`, () => {

    describe(`adding`, () => {

      let snapshot: GraphSnapshot;
      beforeAll(() => {
        const result = write(context, empty, listQuery, {
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
        snapshot = result.snapshot;
      });

      it(`writes the complete graph`, () => {
        expect(snapshot.get(QueryRootId)).to.deep.eq({
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
      });

      it(`doesn't insert duplicate outbound references`, () => {
        expect(snapshot.getNodeSnapshot('a')!.outbound).to.have.deep.members([
          { id: '1', path: ['bar'] },
        ]);
        expect(snapshot.getNodeSnapshot('b')!.outbound).to.have.deep.members([
          { id: '1', path: ['bar'] },
        ]);
      });

      it(`doesn't insert duplicate inbound references for targets`, () => {
        expect(snapshot.getNodeSnapshot('1')!.inbound).to.have.deep.members([
          { id: 'a', path: ['bar'] },
          { id: 'b', path: ['bar'] },
        ]);
      });

    });

    describe(`editing`, () => {

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
        expect(snapshot.get(QueryRootId)).to.deep.eq({
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
        expect(snapshot.getNodeSnapshot('a')!.outbound).to.have.deep.members([
          { id: '2', path: ['bar'] },
        ]);
        expect(snapshot.getNodeSnapshot('b')!.outbound).to.eq(undefined);
      });

      it(`removes unreferenced nodes`, () => {
        expect(snapshot.getNodeSnapshot('1')).to.eq(undefined);
      });

      it(`doesn't insert duplicate inbound references for targets`, () => {
        expect(snapshot.getNodeSnapshot('2')!.inbound).to.have.deep.members([
          { id: 'a', path: ['bar'] },
        ]);
      });

    });

  });

});
