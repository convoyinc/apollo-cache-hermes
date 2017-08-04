import { Configuration } from '../../../src/Configuration';
import { GraphSnapshot } from '../../../src/GraphSnapshot';
import { NodeSnapshot } from '../../../src/NodeSnapshot';
import { write } from '../../../src/operations/write';
import { StaticNodeId } from '../../../src/schema';
import { query } from '../../helpers/graphql';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const config: Configuration = {
    entityIdForNode: (node: any) => {
      return (node && node.id) ? String(node.id) : undefined;
    },
  };

  const rootValuesQuery = query(`{ foo bar }`);

  const viewerQuery = query(`{
    viewer {
      id
      name
    }
  }`);

  const empty = new GraphSnapshot();

  describe(`when only values (to a root)`, () => {

    const { snapshot, editedNodeIds } = write(config, empty, rootValuesQuery, { foo: 123, bar: 'asdf' });

    it(`creates the query root, with the values`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({ foo: 123, bar: 'asdf' });
    });

    it(`marks the root as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
    });

    it(`only contains the root node`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
    });

  });

  describe(`when writing a (new) single entity hanging off of a root`, () => {

    const { snapshot, editedNodeIds } = write(config, empty, viewerQuery, {
      viewer: { id: 123, name: 'Gouda' },
    });

    it(`creates the query root, referencing the entity`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({
        viewer: { id: 123, name: 'Gouda' },
      });
    });

    it(`indexes the entity`, () => {
      expect(snapshot.get('123')).to.deep.eq({
        id: 123, name: 'Gouda',
      });
    });

    it(`directly references viewer from the query root`, () => {
      const queryRoot = snapshot.get(QueryRootId);
      const viewer = snapshot.get('123');
      expect(queryRoot.viewer).to.eq(viewer);
    });

    it(`records the outbound reference from the query root`, () => {
      const queryRoot = snapshot.getSnapshot(QueryRootId) as NodeSnapshot;
      expect(queryRoot.outbound).to.deep.eq([{ id: '123', path: ['viewer'] }]);
      expect(queryRoot.inbound).to.eq(undefined);
    });

    it(`records the inbound reference from referenced entity`, () => {
      const queryRoot = snapshot.getSnapshot('123') as NodeSnapshot;
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

  describe(`when editing leaf values of a root`, () => {

    const { snapshot: baseline } = write(config, empty, rootValuesQuery, { foo: 123, bar: { baz: 'asdf' } });
    const { snapshot, editedNodeIds } = write(config, baseline, rootValuesQuery, { foo: 321 });

    it(`doesn't mutate the previous version`, () => {
      expect(baseline.get(QueryRootId)).to.not.eq(snapshot.get(QueryRootId));
      expect(baseline.get(QueryRootId)).to.deep.eq({ foo: 123, bar: { baz: 'asdf' } });
    });

    it(`updates the value, and its container`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({ foo: 321, bar: { baz: 'asdf' } });
    });

    it(`doesn't mutate other values`, () => {
      expect(snapshot.get(QueryRootId).bar).to.eq(baseline.get(QueryRootId).bar);
    });

    it(`marks the root as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
    });

    it(`only contains the root node`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
    });

  });


  describe(`when editing nested values of a root`, () => {

    const { snapshot: baseline } = write(config, empty, rootValuesQuery, {
      foo: [{ value: 1 }, { value: 2 }, { value: 3 }],
      bar: { baz: 'asdf' },
    });
    const { snapshot, editedNodeIds } = write(config, baseline, rootValuesQuery, {
      foo: [{ value: -1 }, { extra: true }],
      bar: {
        baz: 'fdsa',
        fizz: 'buzz',
      },
    });

    it(`doesn't mutate the previous version`, () => {
      expect(baseline.get(QueryRootId)).to.not.eq(snapshot.get(QueryRootId));
      expect(baseline.get(QueryRootId)).to.deep.eq({
        foo: [{ value: 1 }, { value: 2 }, { value: 3 }],
        bar: { baz: 'asdf' },
      });
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

    it(`merges new values in array elements`, () => {
      expect(snapshot.get(QueryRootId).foo[1]).to.deep.eq({ value: 2, extra: true });
    });

    it(`marks the root as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
    });

    it(`only contains the root node`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
    });

  });

  describe(`when updating values in referenced nodes`, () => {

    const { snapshot: baseline } = write(config, empty, rootValuesQuery, {
      foo: { id: 1, name: 'Foo' },
      bar: { id: 2, name: 'Bar' },
    });
    const { snapshot, editedNodeIds } = write(config, baseline, rootValuesQuery, {
      foo: { id: 1, name: 'Foo Boo' },
      bar: { id: 2, extra: true },
    });

    it(`doesn't mutate the previous versions`, () => {
      expect(baseline.get(QueryRootId)).to.not.eq(snapshot.get(QueryRootId));
      expect(baseline.get('1')).to.not.eq(snapshot.get('1'));
      expect(baseline.get('2')).to.not.eq(snapshot.get('2'));
      expect(baseline.get(QueryRootId)).to.deep.eq({
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
    });

    it(`updates existing values in referenced nodes`, () => {
      expect(snapshot.get('1')).to.deep.eq({ id: 1, name: 'Foo Boo' });
    });

    it(`inserts new values in referenced nodes`, () => {
      expect(snapshot.get('2')).to.deep.eq({ id: 2, name: 'Bar', extra: true });
    });

    it(`updates references to the newly edited nodes`, () => {
      const root = snapshot.get(QueryRootId);
      expect(root.foo).to.eq(snapshot.get('1'));
      expect(root.bar).to.eq(snapshot.get('2'));
    });

    it(`doesn't mark regenerated nodes as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members(['1', '2']);
    });

    it(`contains the correct nodes`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1', '2']);
    });

  });

  describe(`when swapping references`, () => {

    const { snapshot: baseline } = write(config, empty, rootValuesQuery, {
      foo: { id: 1, name: 'Foo' },
      bar: { id: 2, name: 'Bar' },
    });
    const { snapshot, editedNodeIds } = write(config, baseline, rootValuesQuery, {
      foo: { id: 2 },
      bar: { id: 1 },
    });

    it(`doesn't mutate the previous versions`, () => {
      expect(baseline.get(QueryRootId)).to.not.eq(snapshot.get(QueryRootId));
      expect(baseline.get('1')).to.not.eq(snapshot.get('1'));
      expect(baseline.get('2')).to.not.eq(snapshot.get('2'));
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
      const queryRoot = snapshot.getSnapshot(QueryRootId) as NodeSnapshot;
      expect(queryRoot.outbound).to.have.deep.members([
        { id: '2', path: ['foo'] },
        { id: '1', path: ['bar'] },
      ]);
      expect(queryRoot.inbound).to.eq(undefined);
    });

    it(`updates inbound references`, () => {
      const foo = snapshot.getSnapshot('1') as NodeSnapshot;
      const bar = snapshot.getSnapshot('2') as NodeSnapshot;
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

  describe(`when orphaning a node`, () => {

    const { snapshot: baseline } = write(config, empty, rootValuesQuery, {
      foo: { id: 1, name: 'Foo' },
      bar: { id: 2, name: 'Bar' },
    });
    const { snapshot, editedNodeIds } = write(config, baseline, rootValuesQuery, {
      bar: null,
    });

    it(`doesn't mutate the previous versions`, () => {
      expect(baseline.get(QueryRootId)).to.not.eq(snapshot.get(QueryRootId));
      expect(baseline.get('1')).to.eq(snapshot.get('1'));
      expect(baseline.get('2')).to.not.eq(snapshot.get('2'));
      expect(baseline.get(QueryRootId)).to.deep.eq({
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
    });

    it(`replaces the reference with null`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({
        foo: { id: 1, name: 'Foo' },
        bar: null,
      });
    });

    it(`updates outbound references`, () => {
      const queryRoot = snapshot.getSnapshot(QueryRootId) as NodeSnapshot;
      expect(queryRoot.outbound).to.have.deep.members([{ id: '1', path: ['foo'] }]);
    });

    it(`marks the container and orphaned node as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '2']);
    });

    it(`contains the correct nodes`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1']);
    });

  });

  describe(`when orphaning a subgraph`, () => {

    const { snapshot: baseline } = write(config, empty, rootValuesQuery, {
      foo: { id: 1, name: 'Foo' },
      bar: {
        id: 2,
        one: { id: 111 },
        two: { id: 222 },
        three: {
          id: 333,
          foo: { id: 1 },
        },
      },
    });
    const { snapshot, editedNodeIds } = write(config, baseline, rootValuesQuery, {
      bar: null,
    });

    it(`doesn't mutate the previous versions`, () => {
      expect(baseline.get(QueryRootId)).to.deep.eq({
        foo: { id: 1, name: 'Foo' },
        bar: {
          id: 2,
          one: { id: 111 },
          two: { id: 222 },
          three: {
            id: 333,
            foo: { id: 1, name: 'Foo' },
          },
        },
      });
    });

    it(`replaces the reference with null`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({
        foo: { id: 1, name: 'Foo' },
        bar: null,
      });
    });

    it(`preserves nodes that only lost some of their inbound references`, () => {
      expect(snapshot.get('1')).to.deep.eq({ id: 1, name: 'Foo' });
    });

    it(`updates outbound references`, () => {
      const queryRoot = snapshot.getSnapshot(QueryRootId) as NodeSnapshot;
      expect(queryRoot.outbound).to.have.deep.members([{ id: '1', path: ['foo'] }]);
    });

    it(`marks the container and all orphaned nodes as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '2', '111', '222', '333']);
    });

    it(`contains the correct nodes`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1']);
    });

  });

});
