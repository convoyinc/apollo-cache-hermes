import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { write } from '../../../../src/operations/write';
import { NodeId, RawQuery, StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`cyclic references`, () => {

    describe(`initial state`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
      beforeAll(() => {
        const cyclicQuery = query(`{
          foo {
            id
            name
            bar {
              id
              name
              fizz { id }
              buzz { id }
            }
          }
        }`);

        const result = write(context, empty, cyclicQuery, {
          foo: {
            id: 1,
            name: 'Foo',
            bar: {
              id: 2,
              name: 'Bar',
              fizz: { id: 1 },
              buzz: { id: 2 },
            },
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`constructs a normalized cyclic graph`, () => {
        const foo = snapshot.get('1');
        const bar = snapshot.get('2');

        expect(foo.id).to.eq(1);
        expect(foo.name).to.eq('Foo');
        expect(foo.bar).to.eq(bar);

        expect(bar.id).to.eq(2);
        expect(bar.name).to.eq('Bar');
        expect(bar.fizz).to.eq(foo);
        expect(bar.buzz).to.eq(bar);
      });

      it(`properly references the cyclic nodes via QueryRoot`, () => {
        expect(snapshot.get(QueryRootId).foo).to.eq(snapshot.get('1'));
      });

      it(`marks all the nodes as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1', '2']);
      });

    });

    describe(`when editing`, () => {

      let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
      beforeAll(() => {
        const cyclicQuery = query(`{
          foo {
            id
            name
            bar {
              id
              name
              fizz { id }
              buzz { id }
            }
          }
        }`);

        const baselineResult = write(context, empty, cyclicQuery, {
          foo: {
            id: 1,
            name: 'Foo',
            bar: {
              id: 2,
              name: 'Bar',
              fizz: { id: 1 },
              buzz: { id: 2 },
            },
          },
        });
        baseline = baselineResult.snapshot;

        const result = write(context, baseline, cyclicQuery, {
          foo: {
            bar: {
              name: 'Barrington',
            },
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`doesn't mutate the previous version`, () => {
        const foo = baseline.get('1');
        const bar = baseline.get('2');

        expect(foo.id).to.eq(1);
        expect(foo.name).to.eq('Foo');
        expect(foo.bar).to.eq(bar);

        expect(bar.id).to.eq(2);
        expect(bar.name).to.eq('Bar');
        expect(bar.fizz).to.eq(foo);
        expect(bar.buzz).to.eq(bar);
      });

      it(`fixes all references to the edited node`, () => {
        const foo = snapshot.get('1');
        const bar = snapshot.get('2');

        expect(foo.id).to.eq(1);
        expect(foo.name).to.eq('Foo');
        expect(foo.bar).to.eq(bar);

        expect(bar.id).to.eq(2);
        expect(bar.name).to.eq('Barrington');
        expect(bar.fizz).to.eq(foo);
        expect(bar.buzz).to.eq(bar);
      });

      it(`only marks the edited node`, () => {
        expect(Array.from(editedNodeIds)).to.have.members(['2']);
      });

    });

    describe(`when removing some inbound references`, () => {

      let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
      beforeAll(() => {
        const cyclicQuery = query(`{
          foo {
            id
            name
            bar {
              id
              name
              fizz { id }
              buzz { id }
            }
          }
        }`);

        const baselineResult = write(context, empty, cyclicQuery, {
          foo: {
            id: 1,
            name: 'Foo',
            bar: {
              id: 2,
              name: 'Bar',
              fizz: { id: 1 },
              buzz: { id: 2 },
            },
          },
        });
        baseline = baselineResult.snapshot;

        const result = write(context, baseline, cyclicQuery, {
          foo: {
            bar: {
              fizz: null,
              buzz: null,
            },
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`doesn't mutate the previous version`, () => {
        const foo = baseline.get('1');
        const bar = baseline.get('2');

        expect(foo.id).to.eq(1);
        expect(foo.name).to.eq('Foo');
        expect(foo.bar).to.eq(bar);

        expect(bar.id).to.eq(2);
        expect(bar.name).to.eq('Bar');
        expect(bar.fizz).to.eq(foo);
        expect(bar.buzz).to.eq(bar);
      });

      it(`fixes all references to the edited node`, () => {
        const foo = snapshot.get('1');
        const bar = snapshot.get('2');

        expect(foo.id).to.eq(1);
        expect(foo.name).to.eq('Foo');
        expect(foo.bar).to.eq(bar);

        expect(bar.id).to.eq(2);
        expect(bar.name).to.eq('Bar');
        expect(bar.fizz).to.eq(null);
        expect(bar.buzz).to.eq(null);
      });

      it(`only marks the edited node`, () => {
        expect(Array.from(editedNodeIds)).to.have.members(['2']);
      });

    });

    describe(`when orphaning a cyclic subgraph`, () => {

      let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
      beforeAll(() => {
        const cyclicQuery = query(`{
          foo {
            id
            name
            bar {
              id
              name
              fizz { id }
              buzz { id }
            }
          }
        }`);

        const baselineResult = write(context, empty, cyclicQuery, {
          foo: {
            id: 1,
            name: 'Foo',
            bar: {
              id: 2,
              name: 'Bar',
              fizz: { id: 1 },
              buzz: { id: 2 },
            },
          },
        });
        baseline = baselineResult.snapshot;

        const result = write(context, baseline, cyclicQuery, {
          foo: null,
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`doesn't mutate the previous version`, () => {
        const foo = baseline.get('1');
        const bar = baseline.get('2');

        expect(foo.id).to.eq(1);
        expect(foo.name).to.eq('Foo');
        expect(foo.bar).to.eq(bar);

        expect(bar.id).to.eq(2);
        expect(bar.name).to.eq('Bar');
        expect(bar.fizz).to.eq(foo);
        expect(bar.buzz).to.eq(bar);
      });

      it(`removes the reference to the subgraph`, () => {
        expect(snapshot.get(QueryRootId).foo).to.eq(null);
      });

      // TODO: Detect this case, and actually make it work.  Mark & sweep? :(
      it.skip(`garbage collects the orphaned subgraph`, () => {
        expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
      });

      it.skip(`marks all nodes as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1', '2']);
      });

    });

    describe(`cyclic references in payloads`, () => {

      let cyclicQuery: RawQuery, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
      beforeAll(() => {
        cyclicQuery = query(`{
          foo {
            id
            name
            bar {
              id
              name
              foo { id }
            }
          }
          baz
        }`);

        const foo = { id: 1, name: 'Foo', bar: null as any };
        const bar = { id: 2, name: 'Bar', foo };
        foo.bar = bar;

        const result = write(context, empty, cyclicQuery, { foo, baz: null });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`can construct a graph from a cyclic payload`, () => {
        const root = snapshot.get(QueryRootId);
        const foo = snapshot.get('1');
        const bar = snapshot.get('2');
        expect(root.foo).to.eq(foo);
        expect(foo.bar).to.eq(bar);
        expect(bar.foo).to.eq(foo);
      });

      it(`can update cyclic graphs with payloads built from the graph`, () => {
        // A common case is to update an existing graph by shallow cloning it.
        const root = snapshot.get(QueryRootId);

        const result = write(context, snapshot, cyclicQuery, { ...root, baz: 'hello' });
        expect(result.snapshot.get(QueryRootId).baz).to.eq('hello');
      });

    });

    describe.skip(`cyclic values in payloads`, () => {

      let cyclicQuery: RawQuery, snapshot: GraphSnapshot;
      // Jest ALWAYS runs beforeAll…
      /*
      beforeAll(() => {
        cyclicQuery = query(`{
          foo {
            name
            bar {
              name
              foo { name }
            }
          }
          baz
        }`);

        const foo = { name: 'Foo', bar: null as any };
        const bar = { name: 'Bar', foo };
        foo.bar = bar;

        const result = write(context, empty, cyclicQuery, { foo, baz: null });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });
       */

      it(`can construct a graph from a cyclic payload`, () => {
        // Note that we explicitly DO NOT construct graph cycles for
        // non-references!
        expect(snapshot.get(QueryRootId)).to.deep.eq({
          foo: {
            name: 'Foo',
            bar: {
              name: 'Bar',
              foo: { name: 'Foo' },
            },
          },
        });
      });

      it(`can update cyclic graphs with payloads built from the graph`, () => {
        // A common case is to update an existing graph by shallow cloning it.
        const root = snapshot.get(QueryRootId);

        const result = write(context, snapshot, cyclicQuery, { ...root, baz: 'hello' });
        expect(result.snapshot.get(QueryRootId).baz).to.eq('hello');
      });

    });

  });

});
