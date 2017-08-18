import * as _ from 'lodash';

import { CacheContext } from '../../../src/context';
import { GraphSnapshot } from '../../../src/GraphSnapshot';
import { NodeSnapshot } from '../../../src/NodeSnapshot';
import { nodeIdForParameterizedValue } from '../../../src/operations/SnapshotEditor';
import { write } from '../../../src/operations/write';
import { NodeId, Query, StaticNodeId } from '../../../src/schema';
import { query } from '../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const config = new CacheContext();

  const rootValuesQuery = query(`{ foo bar }`);

  const viewerQuery = query(`{
    viewer {
      id
      name
    }
  }`);

  const empty = new GraphSnapshot();

  describe(`when only values (to a root)`, () => {

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const result = write(config, empty, rootValuesQuery, { foo: 123, bar: 'asdf' });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

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

    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const result = write(config, empty, viewerQuery, {
        viewer: { id: 123, name: 'Gouda' },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
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

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(config, empty, rootValuesQuery, { foo: 123, bar: { baz: 'asdf' } });
      baseline = baselineResult.snapshot;

      const result = write(config, baseline, rootValuesQuery, { foo: 321 });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

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

  describe(`when writing falsy values`, () => {

    let falsyValuesQuery: Query, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      falsyValuesQuery = query(`{ null, false, zero, string }`);

      const result = write(config, empty, rootValuesQuery, { null: null, false: false, zero: 0, string: '' });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`persists all falsy values`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({ null: null, false: false, zero: 0, string: '' });
    });

  });

  describe(`when editing nested values of a root`, () => {

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(config, empty, rootValuesQuery, {
        foo: [{ value: 1 }, { value: 2 }, { value: 3 }],
        bar: { baz: 'asdf' },
      });
      baseline = baselineResult.snapshot;

      const result = write(config, baseline, rootValuesQuery, {
        foo: [{ value: -1 }, { extra: true }],
        bar: {
          baz: 'fdsa',
          fizz: 'buzz',
        },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
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

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(config, empty, rootValuesQuery, {
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
      baseline = baselineResult.snapshot;

      const result = write(config, baseline, rootValuesQuery, {
        foo: { id: 1, name: 'Foo Boo' },
        bar: { id: 2, extra: true },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
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

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(config, empty, rootValuesQuery, {
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
      baseline = baselineResult.snapshot;

      const result = write(config, baseline, rootValuesQuery, {
        foo: { id: 2 },
        bar: { id: 1 },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
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

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(config, empty, rootValuesQuery, {
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
      baseline = baselineResult.snapshot;

      const result = write(config, baseline, rootValuesQuery, {
        bar: null,
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
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

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(config, empty, rootValuesQuery, {
        foo: {
          id: 1,
          name: 'Foo',
          two: { id: 222 },
        },
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
      baseline = baselineResult.snapshot;

      const result = write(config, baseline, rootValuesQuery, {
        foo: { two: null },
        bar: null,
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`doesn't mutate the previous versions`, () => {
      expect(baseline.get(QueryRootId)).to.deep.eq({
        foo: {
          id: 1,
          name: 'Foo',
          two: { id: 222 },
        },
        bar: {
          id: 2,
          one: { id: 111 },
          two: { id: 222 },
          three: {
            id: 333,
            foo: {
              id: 1,
              name: 'Foo',
              two: { id: 222 },
            },
          },
        },
      });
    });

    it(`replaces the reference with null`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({
        foo: { id: 1, name: 'Foo', two: null },
        bar: null,
      });
    });

    it(`preserves nodes that only lost some of their inbound references`, () => {
      expect(snapshot.get('1')).to.deep.eq({ id: 1, name: 'Foo', two: null });
    });

    it(`updates outbound references`, () => {
      const queryRoot = snapshot.getSnapshot(QueryRootId) as NodeSnapshot;
      expect(queryRoot.outbound).to.have.deep.members([{ id: '1', path: ['foo'] }]);
    });

    it(`marks the container and all orphaned nodes as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1', '2', '111', '222', '333']);
    });

    it(`contains the correct nodes`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1']);
    });

  });

  describe(`when merging unidentifiable payloads with previously known nodes`, () => {

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(config, empty, rootValuesQuery, {
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
      baseline = baselineResult.snapshot;

      const result = write(config, baseline, rootValuesQuery, {
        foo: { name: 'Foo Boo' },
        bar: { extra: true },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
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

  describe(`writing to inner nodes`, () => {

    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(config, empty, rootValuesQuery, {
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
      baseline = baselineResult.snapshot;

      const innerNodeQuery = query(`{ name extra }`, undefined, '1');
      const result = write(config, baseline, innerNodeQuery, {
        name: 'moo',
        extra: true,
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`doesn't mutate the previous versions`, () => {
      expect(baseline.get(QueryRootId)).to.not.eq(snapshot.get(QueryRootId));
      expect(baseline.get('1')).to.not.eq(snapshot.get('1'));
      expect(baseline.get('2')).to.eq(snapshot.get('2'));
      expect(baseline.get(QueryRootId)).to.deep.eq({
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar' },
      });
    });

    it(`edits the inner node`, () => {
      expect(snapshot.get('1')).to.deep.eq({ id: 1, name: 'moo', extra: true });
    });

    it(`marks only the inner node as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members(['1']);
    });

  });

  describe(`parameterized edges`, () => {

    describe(`creating a new top level edge`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            name extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const result = write(config, empty, parameterizedQuery, {
          foo: {
            name: 'Foo',
            extra: false,
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`writes a node for the edge`, () => {
        expect(snapshot.get(parameterizedId)).to.deep.eq({ name: 'Foo', extra: false });
      });

      it(`creates an outgoing reference from the edge's container`, () => {
        const queryRoot = snapshot.getSnapshot(QueryRootId) as NodeSnapshot;
        expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: undefined }]);
      });

      it(`creates an inbound reference to the edge's container`, () => {
        const values = snapshot.getSnapshot(parameterizedId) as NodeSnapshot;
        expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: undefined }]);
      });

      it(`does not expose the parameterized edge directly from its container`, () => {
        expect(_.get(snapshot.get(QueryRootId), 'foo')).to.eq(undefined);
      });

      it(`marks only the new edge as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
      });

    });

    describe(`creating a nested edge`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo {
            bar {
              baz(id: $id, withExtra: true) {
                name extra
              }
            }
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo', 'bar', 'baz'], { id: 1, withExtra: true });

        const result = write(config, empty, parameterizedQuery, {
          foo: {
            bar: {
              baz: {
                name: 'Foo',
                extra: false,
              },
            },
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`writes a node for the edge`, () => {
        expect(snapshot.get(parameterizedId)).to.deep.eq({ name: 'Foo', extra: false });
      });

      it(`creates an outgoing reference from the edge's container`, () => {
        const queryRoot = snapshot.getSnapshot(QueryRootId) as NodeSnapshot;
        expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: undefined }]);
      });

      it(`creates an inbound reference to the edge's container`, () => {
        const values = snapshot.getSnapshot(parameterizedId) as NodeSnapshot;
        expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: undefined }]);
      });

      it(`does not expose the parameterized edge directly from its container`, () => {
        expect(_.get(snapshot.get(QueryRootId), 'foo.bar.baz')).to.eq(undefined);
      });

      it(`marks only the new edge as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
      });

    });

    describe(`updating an edge`, () => {

      let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            name extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const baselineResult = write(config, empty, parameterizedQuery, {
          foo: {
            name: 'Foo',
            extra: false,
          },
        });
        baseline = baselineResult.snapshot;

        const result = write(config, baseline, parameterizedQuery, {
          foo: {
            name: 'Foo Bar',
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`doesn't edit the original snapshot`, () => {
        expect(_.get(baseline.get(QueryRootId), 'foo')).to.eq(undefined);
        expect(baseline.get(parameterizedId)).to.deep.eq({ name: 'Foo', extra: false });
        expect(baseline.get(parameterizedId)).to.not.eq(snapshot.get(parameterizedId));
      });

      it(`updates the node for the edge`, () => {
        expect(snapshot.get(parameterizedId)).to.deep.eq({ name: 'Foo Bar', extra: false });
      });

      it(`marks only the edge as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
      });

    });

    describe(`new edges with a direct reference`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            id name extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const result = write(config, empty, parameterizedQuery, {
          foo: {
            id: 1,
            name: 'Foo',
            extra: false,
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`writes a node for the new entity`, () => {
        expect(snapshot.get('1')).to.deep.eq({ id: 1, name: 'Foo', extra: false });
      });

      it(`writes a node for the edge that points to the entity's value`, () => {
        expect(snapshot.get(parameterizedId)).to.eq(snapshot.get('1'));
      });

      it(`creates an outgoing reference from the edge's container`, () => {
        const queryRoot = snapshot.getSnapshot(QueryRootId) as NodeSnapshot;
        expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: undefined }]);
      });

      it(`creates an inbound reference to the edge's container`, () => {
        const values = snapshot.getSnapshot(parameterizedId) as NodeSnapshot;
        expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: undefined }]);
      });

      it(`creates an outgoing reference from the parameterized edge to the referenced entity`, () => {
        const values = snapshot.getSnapshot(parameterizedId) as NodeSnapshot;
        expect(values.outbound).to.deep.eq([{ id: '1', path: [] }]);
      });

      it(`creates an incoming reference from the parameterized edge to the referenced entity`, () => {
        const entity = snapshot.getSnapshot('1') as NodeSnapshot;
        expect(entity.inbound).to.deep.eq([{ id: parameterizedId, path: [] }]);
      });

      it(`does not expose the parameterized edge directly from its container`, () => {
        expect(_.get(snapshot.get(QueryRootId), 'foo')).to.eq(undefined);
      });

      it(`marks the new edge and entity as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId, '1']);
      });

    });

    describe(`updating edges with an array of direct references`, () => {

      let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            id name extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const baselineResult = write(config, empty, parameterizedQuery, {
          foo: [
            { id: 1, name: 'Foo', extra: false },
            { id: 2, name: 'Bar', extra: true },
            { id: 3, name: 'Baz', extra: false },
          ],
        });
        baseline = baselineResult.snapshot;

        const result = write(config, baseline, parameterizedQuery, {
          foo: [
            { extra: true },
            { extra: false },
            { extra: true },
          ],
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`writes nodes for each entity`, () => {
        expect(snapshot.get('1')).to.deep.eq({ id: 1, name: 'Foo', extra: true });
        expect(snapshot.get('2')).to.deep.eq({ id: 2, name: 'Bar', extra: false });
        expect(snapshot.get('3')).to.deep.eq({ id: 3, name: 'Baz', extra: true });
      });

      it(`writes an array for the parameterized node`, () => {
        expect(snapshot.get(parameterizedId)).to.deep.eq([
          { id: 1, name: 'Foo', extra: true },
          { id: 2, name: 'Bar', extra: false },
          { id: 3, name: 'Baz', extra: true },
        ]);
      });

    });

    describe(`updating an edge with a direct reference`, () => {

      let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            id name extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const baselineResult = write(config, empty, parameterizedQuery, {
          foo: {
            id: 1,
            name: 'Foo',
            extra: false,
          },
        });
        baseline = baselineResult.snapshot;

        const result = write(config, baseline, parameterizedQuery, {
          foo: {
            id: 1,
            name: 'Foo Bar',
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`doesn't edit the original snapshot`, () => {
        expect(_.get(baseline.get(QueryRootId), 'foo')).to.eq(undefined);
        expect(baseline.get('1')).to.deep.eq({ id: 1, name: 'Foo', extra: false });
        expect(baseline.get('1')).to.not.eq(snapshot.get('1'));
      });

      it(`updates the node for the edge`, () => {
        expect(snapshot.get(parameterizedId)).to.deep.eq({ id: 1, name: 'Foo Bar', extra: false });
      });

      it(`writes a node for the edge that points to the entity's value`, () => {
        expect(snapshot.get(parameterizedId)).to.eq(snapshot.get('1'));
      });

      it(`marks only the entity as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members(['1']);
      });

    });

    describe(`indirectly updating an edge with a direct reference`, () => {

      let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            id name extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const baselineResult = write(config, empty, parameterizedQuery, {
          foo: {
            id: 1,
            name: 'Foo',
            extra: false,
          },
        });
        baseline = baselineResult.snapshot;

        const result = write(config, baseline, viewerQuery, {
          viewer: {
            id: 1,
            name: 'Foo Bar',
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`doesn't edit the original snapshot`, () => {
        expect(_.get(baseline.get(QueryRootId), 'foo')).to.eq(undefined);
        expect(baseline.get('1')).to.deep.eq({ id: 1, name: 'Foo', extra: false });
        expect(baseline.get('1')).to.not.eq(snapshot.get('1'));
      });

      it(`updates the node for the edge`, () => {
        expect(snapshot.get(parameterizedId)).to.deep.eq({ id: 1, name: 'Foo Bar', extra: false });
      });

      it(`ensures normalized references`, () => {
        const entity = snapshot.get('1');
        expect(snapshot.get(QueryRootId).viewer).to.eq(entity);
        expect(snapshot.get(parameterizedId)).to.eq(entity);
      });

      it(`marks only the entity as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1']);
      });

    });

    describe(`writing nested indirect edges contained in an array`, () => {

      let snapshot: GraphSnapshot, containerId: NodeId, entry1Id: NodeId, entry2Id: NodeId;
      beforeAll(() => {
        const nestedQuery = query(`query nested($id: ID!) {
          one {
            two(id: $id) {
              three {
                four(extra: true) {
                  five
                }
              }
            }
          }
        }`, { id: 1 });

        containerId = nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
        entry1Id = nodeIdForParameterizedValue(containerId, [0, 'three', 'four'], { extra: true });
        entry2Id = nodeIdForParameterizedValue(containerId, [1, 'three', 'four'], { extra: true });

        snapshot = write(config, empty, nestedQuery, {
          one: {
            two: [
              {
                three: {
                  four: { five: 1 },
                },
              },
              {
                three: {
                  four: { five: 2 },
                },
              },
            ],
          },
        }).snapshot;
      });

      it(`writes a value snapshot for the containing edge`, () => {
        expect(snapshot.getSnapshot(containerId)).to.exist;
      });

      it(`writes value snapshots for each array entry`, () => {
        expect(snapshot.getSnapshot(entry1Id)).to.exist;
        expect(snapshot.getSnapshot(entry2Id)).to.exist;
      });

      it(`references the parent snapshot from the children`, () => {
        const entry1 = snapshot.getSnapshot(entry1Id) as NodeSnapshot;
        const entry2 = snapshot.getSnapshot(entry2Id) as NodeSnapshot;

        expect(entry1.inbound).to.have.deep.members([{ id: containerId, path: undefined }]);
        expect(entry2.inbound).to.have.deep.members([{ id: containerId, path: undefined }]);
      });

      it(`references the children from the parent`, () => {
        const container = snapshot.getSnapshot(containerId) as NodeSnapshot;

        expect(container.outbound).to.have.deep.members([
          { id: entry1Id, path: undefined },
          { id: entry2Id, path: undefined },
        ]);
      });

      it(`writes an array with the correct length`, () => {
        // This is a bit arcane, but it ensures that _overlayParameterizedValues
        // behaves properly when iterating arrays that contain _only_
        // parameterized edges.
        expect(snapshot.get(containerId)).to.deep.eq([undefined, undefined]);
      });

    });

  });

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

        const result = write(config, empty, cyclicQuery, {
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

        const baselineResult = write(config, empty, cyclicQuery, {
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

        const result = write(config, baseline, cyclicQuery, {
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

        const baselineResult = write(config, empty, cyclicQuery, {
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

        const result = write(config, baseline, cyclicQuery, {
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

        const baselineResult = write(config, empty, cyclicQuery, {
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

        const result = write(config, baseline, cyclicQuery, {
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

      let cyclicQuery: Query, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
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

        const foo = { id: 1, name: 'Foo', bar: null as any};
        const bar = { id: 2, name: 'Bar', foo };
        foo.bar = bar;

        const result = write(config, empty, cyclicQuery, { foo, baz: null });
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

        const result = write(config, snapshot, cyclicQuery, { ...root, baz: 'hello' });
        expect(result.snapshot.get(QueryRootId).baz).to.eq('hello');
      });

    });

    describe.skip(`cyclic values in payloads`, () => {

      let cyclicQuery: Query, snapshot: GraphSnapshot;
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

        const result = write(config, empty, cyclicQuery, { foo, baz: null });
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

        const result = write(config, snapshot, cyclicQuery, { ...root, baz: 'hello' });
        expect(result.snapshot.get(QueryRootId).baz).to.eq('hello');
      });

    });

  });

  describe(`custom types with object values`, () => {

    describe(`an empty object value`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
      beforeAll(() => {
        const result = write(config, empty, rootValuesQuery, {
          foo: {},
          bar: [],
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`stores the values`, () => {
        expect(snapshot.get(QueryRootId)).to.deep.eq({
          foo: {},
          bar: [],
        });
      });

      it(`marks the container as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
      });

    });

    describe(`custom value with id fields in it`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
      beforeAll(() => {
        const result = write(config, empty, rootValuesQuery, {
          foo: { id: 1 },
          bar: {
            baz: { id: 1 },
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`stores the values`, () => {
        expect(snapshot.get(QueryRootId)).to.deep.eq({
          foo: { id: 1 },
          bar: {
            baz: { id: 1 },
          },
        });
      });

      // TODO: We need to walk the selection set when writing, too!
      it.skip(`does not normalize the values of the custom type`, () => {
        expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
      });

      // TODO: We need to walk the selection set when writing, too!
      it.skip(`marks the container as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
      });

    });

  });

  describe(`field alias`, () => {
    describe(`basic aliasing without parameterized edge`, () => {
      const basicAliasQuery = query(`{
        foo {
          ID: id
          FirstName: name
        }
      }`);

      const entityAliasQuery = query(`{
        aliasFoo: foo {
          ID: id
          FirstName: name
        }
      }`);

      it(`write using alias name`, () => {
        const snapshot = write(config, empty, basicAliasQuery, {
          foo: {
            ID: 0,
            FirstName: "Foo Foo"
          }
        }).snapshot;

        expect(snapshot.get(QueryRootId)).to.deep.eq({
          foo: {
            id: 0,
            name: "Foo Foo"
          }
        });
      });

      it(`write using non-alias name`, () => {
        const snapshot = write(config, empty, basicAliasQuery, {
          foo: {
            id: 0,
            name: "Foo Foo"
          }
        }).snapshot;
        
        expect(snapshot.get(QueryRootId)).to.deep.eq({
          foo: {
            id: 0,
            name: "Foo Foo"
          }
        });
      });

      it(`write using alias entity name`, () => {
        const snapshot = write(config, empty, entityAliasQuery, {
          aliasFoo: {
            id: 0,
            FirstName: "Foo Foo"
          }
        }).snapshot;

        expect(snapshot.get(QueryRootId)).to.deep.eq({
          foo: {
            id: 0,
            name: "Foo Foo"
          }
        });
      });

      it(`write using non-alias entity name`, () => {
        const snapshot = write(config, empty, entityAliasQuery, {
          foo: {
            id: 0,
            FirstName: "Foo Foo"
          }
        }).snapshot;

        expect(snapshot.get(QueryRootId)).to.deep.eq({
          foo: {
            id: 0,
            name: "Foo Foo"
          }
        });
      });
    });

    describe(`basic aliasing with parameterized edge`, () => {
      const basicAliasQuery = query(`{
        superUser: user(id: 4) {
          ID: id
          FirstName: name
        }
      }`);

      const parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['user'], { id: 4 });

      it(`write using alias name`, () => {
        const snapshot = write(config, empty, basicAliasQuery, {
          superUser: {
            ID: 0,
            FirstName: "Foo Foo"
          }
        }).snapshot;

        expect(snapshot.get(parameterizedId)).to.deep.eq({
          id: 0,
          name: "Foo Foo"
        });
      });

      it(`write using non-alias name`, () => {
        const snapshot = write(config, empty, basicAliasQuery, {
          user: {
            id: 0,
            name: "Foo Foo"
          }
        }).snapshot;
        
        expect(snapshot.get(parameterizedId)).to.deep.eq({
          id: 0,
          name: "Foo Foo"
        });
      });
    });
  });
});
