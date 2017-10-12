import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { write } from '../../../../../src/operations/write';
import { JsonArray } from '../../../../../src/primitive';
import { RawOperation, StaticNodeId } from '../../../../../src/schema';
import { query, silentConfig, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const silentContext = new CacheContext(silentConfig);
  const empty = new GraphSnapshot();
  const valuesQuery = query(`{ foo bar }`);
  const entityQuery = query(`{
    foo {
      id
      name
    }
    bar {
      id
      name
    }
  }`);

  describe(`edit references in an array`, () => {
    let arrayQuery: RawOperation, snapshot: GraphSnapshot;
    beforeAll(() => {
      arrayQuery = query(`{
        things { id name }
      }`);

      snapshot = write(context, empty, arrayQuery, {
        things: [
          { id: 1, name: 'One' },
          { id: 2, name: 'Two' },
          { id: 3, name: 'Three' },
          { id: 4, name: 'Four' },
          { id: 5, name: 'Five' },
        ],
      }).snapshot;
    });

    it(`sets up outbound references`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)!.outbound).to.have.deep.members([
        { id: '1', path: ['things', 0] },
        { id: '2', path: ['things', 1] },
        { id: '3', path: ['things', 2] },
        { id: '4', path: ['things', 3] },
        { id: '5', path: ['things', 4] },
      ]);
    });

    it(`lets you reorder references`, () => {
      const updated = write(context, snapshot, arrayQuery, {
        things: [
          { id: 5, name: 'Five' },
          { id: 2, name: 'Two' },
          { id: 1, name: 'One' },
          { id: 4, name: 'Four' },
          { id: 3, name: 'Three' },
        ],
      }).snapshot;

      expect(updated.getNodeSnapshot(QueryRootId)!.outbound).to.have.deep.members([
        { id: '5', path: ['things', 0] },
        { id: '2', path: ['things', 1] },
        { id: '1', path: ['things', 2] },
        { id: '4', path: ['things', 3] },
        { id: '3', path: ['things', 4] },
      ]);
    });

    it(`drops references when the array shrinks`, () => {
      const updated = write(context, snapshot, arrayQuery, {
        things: [
          { id: 1, name: 'One' },
          { id: 2, name: 'Two' },
        ],
      }).snapshot;

      expect(updated.getNodeSnapshot(QueryRootId)!.outbound).to.have.deep.members([
        { id: '1', path: ['things', 0] },
        { id: '2', path: ['things', 1] },
      ]);
    });

    it(`supports multiple references to the same node`, () => {
      const updated = write(context, snapshot, arrayQuery, {
        things: [
          { id: 1, name: 'One' },
          { id: 2, name: 'Two' },
          { id: 3, name: 'Three' },
          { id: 4, name: 'Four' },
          { id: 5, name: 'Five' },
          { id: 1, name: 'One' },
          { id: 2, name: 'Two' },
          { id: 3, name: 'Three' },
          { id: 4, name: 'Four' },
          { id: 5, name: 'Five' },
        ],
      }).snapshot;

      expect(updated.getNodeSnapshot(QueryRootId)!.outbound).to.have.deep.members([
        { id: '1', path: ['things', 0] },
        { id: '2', path: ['things', 1] },
        { id: '3', path: ['things', 2] },
        { id: '4', path: ['things', 3] },
        { id: '5', path: ['things', 4] },
        { id: '1', path: ['things', 5] },
        { id: '2', path: ['things', 6] },
        { id: '3', path: ['things', 7] },
        { id: '4', path: ['things', 8] },
        { id: '5', path: ['things', 9] },
      ]);
    });

    it(`supports holes`, () => {
      const updated = write(context, snapshot, arrayQuery, {
        things: [
          null,
          null,
          { id: 3, name: 'Three' },
          { id: 4, name: 'Four' },
          null,
        ],
      }).snapshot;

      expect(updated.getNodeSnapshot(QueryRootId)!.outbound).to.have.deep.members([
        { id: '3', path: ['things', 2] },
        { id: '4', path: ['things', 3] },
      ]);

      expect(updated.getNodeData(QueryRootId)).to.deep.eq({
        things: [
          null,
          null,
          { id: 3, name: 'Three' },
          { id: 4, name: 'Four' },
          null,
        ],
      });
    });

    it(`treats blanks in sparse arrays as null`, () => {
      const updated = write(silentContext, snapshot, arrayQuery, {
        things: [
          undefined,
          undefined,
          { id: 3, name: 'Three' },
          { id: 4, name: 'Four' },
          undefined,
        ] as JsonArray,
      }).snapshot;

      expect(updated.getNodeSnapshot(QueryRootId)!.outbound).to.have.deep.members([
        { id: '3', path: ['things', 2] },
        { id: '4', path: ['things', 3] },
      ]);

      expect(updated.getNodeData(QueryRootId)).to.deep.eq({
        things: [
          null,
          null,
          { id: 3, name: 'Three' },
          { id: 4, name: 'Four' },
          null,
        ],
      });
    });

    it(`allows arrays to shrink`, () => {
      const updated = write(context, snapshot, arrayQuery, {
        things: [
          { id: 1, name: 'One' },
          { id: 2, name: 'Two' },
          { id: 3, name: 'Three' },
        ] as JsonArray,
      }).snapshot;

      expect(updated.getNodeData(QueryRootId)).to.deep.eq({
        things: [
          { id: 1, name: 'One' },
          { id: 2, name: 'Two' },
          { id: 3, name: 'Three' },
        ],
      });
    });

    it(`doesn't consider falsy values as blanks`, () => {
      const { snapshot: baseSnapshot } = write(context, empty, valuesQuery, {
        foo: [1, 2, 3, 4, 5],
        bar: 1,
      });

      const updated = write(context, baseSnapshot, valuesQuery, {
        foo: [
          false,
          0,
          '',
        ] as JsonArray,
        bar: 0,
      }).snapshot;

      expect(updated.getNodeData(QueryRootId)).to.deep.eq({
        foo: [
          false,
          0,
          '',
        ],
        bar: 0,
      });
    });

    it(`throws if we attempt to write non-objects with a selection set`, () => {
      expect(() => {
        write(context, empty, entityQuery, { foo: [1, 2, 3, 4, 5] });
      }).to.throw(/foo\.\d/);
    });

  });
});
