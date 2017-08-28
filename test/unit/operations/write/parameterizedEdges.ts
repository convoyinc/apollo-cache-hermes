import * as _ from 'lodash';
import * as util from 'util';

import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { ParameterizedValueSnapshot } from '../../../../src/nodes';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { write } from '../../../../src/operations/write';
import { NodeId, Query, StaticNodeId } from '../../../../src/schema';
import { query } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  const config = new CacheContext({
    logger: {
      warn(message: string, ...args: any[]) {
        throw new Error(util.format(message, ...args));
      },
    },
  });

  const viewerQuery = query(`{
    viewer {
      id
      name
    }
  }`);

  const empty = new GraphSnapshot();

  describe(`parameterized fields`, () => {

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
        const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
        expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: undefined }]);
      });

      it(`creates an inbound reference to the edge's container`, () => {
        const values = snapshot.getNodeSnapshot(parameterizedId)!;
        expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: undefined }]);
      });

      it(`does not expose the parameterized field directly from its container`, () => {
        expect(_.get(snapshot.get(QueryRootId), 'foo')).to.eq(undefined);
      });

      it(`marks only the new edge as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
      });

      it(`emits a ParameterizedValueSnapshot`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceOf(ParameterizedValueSnapshot);
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
        const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
        expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: undefined }]);
      });

      it(`creates an inbound reference to the edge's container`, () => {
        const values = snapshot.getNodeSnapshot(parameterizedId)!;
        expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: undefined }]);
      });

      it(`does not expose the parameterized field directly from its container`, () => {
        expect(_.get(snapshot.get(QueryRootId), 'foo.bar.baz')).to.eq(undefined);
      });

      it(`marks only the new edge as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
      });

      it(`emits a ParameterizedValueSnapshot`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceOf(ParameterizedValueSnapshot);
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

      it(`emits a ParameterizedValueSnapshot`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceOf(ParameterizedValueSnapshot);
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
        const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
        expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: undefined }]);
      });

      it(`creates an inbound reference to the edge's container`, () => {
        const values = snapshot.getNodeSnapshot(parameterizedId)!;
        expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: undefined }]);
      });

      it(`creates an outgoing reference from the parameterized field to the referenced entity`, () => {
        const values = snapshot.getNodeSnapshot(parameterizedId)!;
        expect(values.outbound).to.deep.eq([{ id: '1', path: [] }]);
      });

      it(`creates an incoming reference from the parameterized field to the referenced entity`, () => {
        const entity = snapshot.getNodeSnapshot('1')!;
        expect(entity.inbound).to.deep.eq([{ id: parameterizedId, path: [] }]);
      });

      it(`does not expose the parameterized field directly from its container`, () => {
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

      let nestedQuery: Query, snapshot: GraphSnapshot, containerId: NodeId, entry1Id: NodeId, entry2Id: NodeId;
      beforeAll(() => {
        nestedQuery = query(`query nested($id: ID!) {
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
        expect(snapshot.getNodeSnapshot(containerId)).to.exist;
      });

      it(`writes value snapshots for each array entry`, () => {
        expect(snapshot.getNodeSnapshot(entry1Id)).to.exist;
        expect(snapshot.getNodeSnapshot(entry2Id)).to.exist;
      });

      it(`references the parent snapshot from the children`, () => {
        const entry1 = snapshot.getNodeSnapshot(entry1Id)!;
        const entry2 = snapshot.getNodeSnapshot(entry2Id)!;

        expect(entry1.inbound).to.have.deep.members([{ id: containerId, path: undefined }]);
        expect(entry2.inbound).to.have.deep.members([{ id: containerId, path: undefined }]);
      });

      it(`references the children from the parent`, () => {
        const container = snapshot.getNodeSnapshot(containerId)!;

        expect(container.outbound).to.have.deep.members([
          { id: entry1Id, path: undefined },
          { id: entry2Id, path: undefined },
        ]);
      });

      it(`writes an array with the correct length`, () => {
        // This is a bit arcane, but it ensures that _overlayParameterizedValues
        // behaves properly when iterating arrays that contain _only_
        // parameterized fields.
        expect(snapshot.get(containerId)).to.deep.eq([undefined, undefined]);
      });

      it(`allows removal of values containing an edge`, () => {
        const updated = write(config, snapshot, nestedQuery, {
          one: {
            two: [
              null,
              {
                three: {
                  four: { five: 2 },
                },
              },
            ],
          },
        }).snapshot;

        expect(updated.get(containerId)).to.deep.eq([null, undefined]);
      });

    });

  });
});
