import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../src/nodes';
import { write } from '../../../../src/operations/write';
import { JsonArray } from '../../../../src/primitive';
import { NodeId, RawOperation, StaticNodeId } from '../../../../src/schema';
import { query, silentConfig, strictConfig } from '../../../helpers';

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

  describe(`edit leaf values of a root`, () => {
    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(context, empty, valuesQuery, { foo: 123, bar: { baz: 'asdf' } });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, valuesQuery, { foo: 321 });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`updates the value, and its container`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({ foo: 321, bar: { baz: 'asdf' } });
    });

    it(`marks the root as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
    });

    it(`only contains the root node`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
    });

    it(`emits the edited node as an EntitySnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
    });

  });

  describe(`edit nested values of a root`, () => {
    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(context, empty, valuesQuery, {
        foo: [{ value: 1 }, { value: 2 }, { value: 3 }],
        bar: { baz: 'asdf' },
      });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, valuesQuery, {
        foo: [{ value: -1 }, { extra: true }],
        bar: {
          baz: 'fdsa',
          fizz: 'buzz',
        },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`merges new properties with existing objects`, () => {
      expect(snapshot.get(QueryRootId).bar).to.deep.eq({ baz: 'fdsa', fizz: 'buzz' });
    });

    it(`honors array lengths`, () => {
      expect(snapshot.get(QueryRootId).foo.length).to.eq(2);
    });

    it(`overwrites previous values in array elements`, () => {
      expect(snapshot.get(QueryRootId).foo[0]).to.deep.eq({ value: -1 });
    });

    it(`no merging of new values in array elements as we copy leaf value`, () => {
      expect(snapshot.get(QueryRootId).foo[1]).to.deep.eq({ extra: true });
    });

    it(`marks the root as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
    });

    it(`only contains the root node`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
    });

  });

  describe(`reference swaps`, () => {
    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(context, empty, entityQuery, {
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, entityQuery, {
        foo: { id: 2 },
        bar: { id: 1 },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`previous versions still have original value`, () => {
      expect(baseline.get(QueryRootId)).to.deep.eq({
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
    });

    it(`preserves unedited nodes from the parent`, () => {
      expect(baseline.get('1').node).to.eq(snapshot.get('1').node);
      expect(baseline.get('2').node).to.eq(snapshot.get('2').node);
    });

    it(`updates outbound references`, () => {
      const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
      expect(queryRoot.outbound).to.have.deep.members([
        { id: '2', path: ['foo'] },
        { id: '1', path: ['bar'] },
      ]);
      expect(queryRoot.inbound).to.eq(undefined);
    });

    it(`updates inbound references`, () => {
      const foo = snapshot.getNodeSnapshot('1')!;
      const bar = snapshot.getNodeSnapshot('2')!;
      expect(foo.inbound).to.have.deep.members([{ id: QueryRootId, path: ['bar'] }]);
      expect(bar.inbound).to.have.deep.members([{ id: QueryRootId, path: ['foo'] }]);
    });

    it(`marks the container as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
    });

    it(`contains the correct nodes`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1', '2']);
    });
  });

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

    it.skip(`drops references when the array shrinks`, () => {
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

      expect(updated.get(QueryRootId)).to.deep.eq({
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

      expect(updated.get(QueryRootId)).to.deep.eq({
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

      expect(updated.get(QueryRootId)).to.deep.eq({
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

      expect(updated.get(QueryRootId)).to.deep.eq({
        foo: [
          false,
          0,
          '',
        ],
        bar: 0,
      });
    });

    it.skip(`throws if we attempt to write non-objects with a selection set`, () => {
      expect(() => {
        write(context, empty, entityQuery, { foo: [1, 2, 3, 4, 5] });
      }).to.throw(/foo\.\d/);
    });

  });

});
