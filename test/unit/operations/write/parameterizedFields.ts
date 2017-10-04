import * as _ from 'lodash';

import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { ParameterizedValueSnapshot } from '../../../../src/nodes';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { write } from '../../../../src/operations/write';
import { NodeId, RawOperation, StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const viewerQuery = query(`{
    viewer {
      id
      name
    }
  }`);

  describe(`parameterized fields`, () => {

    describe(`creating a new top level field`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            name extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const result = write(context, empty, parameterizedQuery, {
          foo: {
            name: 'Foo',
            extra: false,
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`writes a node for the field`, () => {
        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({ name: 'Foo', extra: false });
      });

      it(`creates an outgoing reference from the field's container`, () => {
        const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
        expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: ['foo'] }]);
      });

      it(`creates an inbound reference to the field's container`, () => {
        const values = snapshot.getNodeSnapshot(parameterizedId)!;
        expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: ['foo'] }]);
      });

      it(`does not expose the parameterized field directly from its container`, () => {
        expect(_.get(snapshot.getNodeData(QueryRootId), 'foo')).to.eq(undefined);
      });

      it(`marks only the new field as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
      });

      it(`emits a ParameterizedValueSnapshot`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceOf(ParameterizedValueSnapshot);
      });

    });

    describe(`creating a nested field`, () => {

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

        const result = write(context, empty, parameterizedQuery, {
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

      it(`writes a node for the field`, () => {
        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({ name: 'Foo', extra: false });
      });

      it(`creates an outgoing reference from the field's container`, () => {
        const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
        expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: ['foo', 'bar', 'baz'] }]);
      });

      it(`creates an inbound reference to the field's container`, () => {
        const values = snapshot.getNodeSnapshot(parameterizedId)!;
        expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: ['foo', 'bar', 'baz'] }]);
      });

      it(`does not expose the parameterized field directly from its container`, () => {
        expect(_.get(snapshot.getNodeData(QueryRootId), 'foo.bar.baz')).to.eq(undefined);
      });

      it(`marks only the new field as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
      });

      it(`emits a ParameterizedValueSnapshot`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceOf(ParameterizedValueSnapshot);
      });

    });

    describe(`updating non-entity field`, () => {

      let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            name extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const baselineResult = write(context, empty, parameterizedQuery, {
          foo: {
            name: 'Foo',
            extra: false,
          },
        });
        baseline = baselineResult.snapshot;

        const result = write(context, baseline, parameterizedQuery, {
          foo: {
            name: 'Foo Bar',
            extra: false,
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`updates the node for the field`, () => {
        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({ name: 'Foo Bar', extra: false });
      });

      it(`marks only the field as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
      });

      it(`emits a ParameterizedValueSnapshot`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceOf(ParameterizedValueSnapshot);
      });

    });

    describe(`new fields with a direct reference`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            id name extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const result = write(context, empty, parameterizedQuery, {
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
        expect(snapshot.getNodeData('1')).to.deep.eq({ id: 1, name: 'Foo', extra: false });
      });

      it(`writes a node for the field that points to the entity's value`, () => {
        expect(snapshot.getNodeData(parameterizedId)).to.eq(snapshot.getNodeData('1'));
      });

      it(`creates an outgoing reference from the field's container`, () => {
        const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
        expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: ['foo'] }]);
      });

      it(`creates an inbound reference to the field's container`, () => {
        const values = snapshot.getNodeSnapshot(parameterizedId)!;
        expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: ['foo'] }]);
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
        expect(_.get(snapshot.getNodeData(QueryRootId), 'foo')).to.eq(undefined);
      });

      it(`marks the new field and entity as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId, '1']);
      });

    });

    describe(`updating fields with an array of direct references`, () => {

      let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            id
            name
            extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const baselineResult = write(context, empty, parameterizedQuery, {
          foo: [
            { id: 1, name: 'Foo', extra: false },
            { id: 2, name: 'Bar', extra: true },
            { id: 3, name: 'Baz', extra: false },
          ],
        });
        baseline = baselineResult.snapshot;

        const result = write(context, baseline, parameterizedQuery, {
          foo: [
            { id: 1, name: 'Foo', extra: true },
            { id: 2, name: 'Bar', extra: false },
            { id: 3, name: 'Baz', extra: true },
          ],
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`writes nodes for each entity`, () => {
        expect(baseline.getNodeData('1')).to.deep.eq({ id: 1, name: 'Foo', extra: false });
        expect(baseline.getNodeData('2')).to.deep.eq({ id: 2, name: 'Bar', extra: true });
        expect(baseline.getNodeData('3')).to.deep.eq({ id: 3, name: 'Baz', extra: false });
      });

      it(`updates nodes for each entity`, () => {
        expect(snapshot.getNodeData('1')).to.deep.eq({ id: 1, name: 'Foo', extra: true });
        expect(snapshot.getNodeData('2')).to.deep.eq({ id: 2, name: 'Bar', extra: false });
        expect(snapshot.getNodeData('3')).to.deep.eq({ id: 3, name: 'Baz', extra: true });
      });

      it(`writes an array for the parameterized node`, () => {
        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq([
          { id: 1, name: 'Foo', extra: true },
          { id: 2, name: 'Bar', extra: false },
          { id: 3, name: 'Baz', extra: true },
        ]);
      });

    });

    describe(`directly updating entity field with a direct reference`, () => {

      let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            id
            name
            extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const baselineResult = write(context, empty, parameterizedQuery, {
          foo: {
            id: 1,
            name: 'Foo',
            extra: false,
          },
        });
        baseline = baselineResult.snapshot;

        const result = write(context, baseline, parameterizedQuery, {
          foo: {
            id: 1,
            name: 'Foo Bar',
            extra: false,
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`updates the node for the field`, () => {
        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({ id: 1, name: 'Foo Bar', extra: false });
      });

      it(`writes a node for the field that points to the entity's value`, () => {
        expect(snapshot.getNodeData(parameterizedId)).to.eq(snapshot.getNodeData('1'));
      });

      it(`marks only the entity as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members(['1']);
      });

    });

    describe(`indirectly updating entity field with a direct reference`, () => {

      let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            id name extra
          }
        }`, { id: 1 });

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });

        const baselineResult = write(context, empty, parameterizedQuery, {
          foo: {
            id: 1,
            name: 'Foo',
            extra: false,
          },
        });
        baseline = baselineResult.snapshot;

        const result = write(context, baseline, viewerQuery, {
          viewer: {
            id: 1,
            name: 'Foo Bar',
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`updates the node for the field`, () => {
        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({ id: 1, name: 'Foo Bar', extra: false });
      });

      it(`ensures normalized references`, () => {
        const entity = snapshot.getNodeData('1');
        expect(snapshot.getNodeData(QueryRootId).viewer).to.eq(entity);
        expect(snapshot.getNodeData(parameterizedId)).to.eq(entity);
      });

      it(`marks only the entity as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '1']);
      });

    });

    describe(`writing an entity with nested indirect fields`, () => {
      let nestedQuery: RawOperation, snapshot: GraphSnapshot, parameterizedRootId: NodeId, parameterizedFieldId: NodeId, entityId: NodeId;
      beforeAll(() => {
        nestedQuery = query(`query nested($id: ID!) {
          one {
            two(id: $id) {
              three {
                id
                four(extra: true) {
                  five
                }
              }
            }
          }
        }`, { id: 1 });

        parameterizedRootId = nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
        entityId = '31';
        parameterizedFieldId = nodeIdForParameterizedValue(entityId, ['four'], { extra: true });

        snapshot = write(context, empty, nestedQuery, {
          one: {
            two: {
              three: {
                id: 31,
                four: { five: 1 },
              },
            },
          },
        }).snapshot;
      });

      it(`writes a value snapshot for the containing field`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedRootId)).to.exist;
      });

      it(`writes value snapshots for each array entry`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedFieldId)).to.exist;
      });

      it(`references the parent entity snapshot from the children`, () => {
        const entry1 = snapshot.getNodeSnapshot(parameterizedFieldId)!;

        expect(entry1.inbound).to.have.deep.members([{ id: entityId, path: ['four'] }]);
      });

      it(`references the children from the parent entity`, () => {
        const entity = snapshot.getNodeSnapshot(entityId)!;
        expect(entity.outbound).to.have.deep.members([
          { id: parameterizedFieldId, path: ['four'] },
        ]);
      });

      it(`references the children from the parameterized root`, () => {
        const container = snapshot.getNodeSnapshot(parameterizedRootId)!;

        expect(container.outbound).to.have.deep.members([
          { id: entityId, path: ['three'] },
        ]);
      });

      it(`writes an array with the correct length`, () => {
        // This is a bit arcane, but it ensures that _overlayParameterizedValues
        // behaves properly when iterating arrays that contain _only_
        // parameterized fields.
        expect(snapshot.getNodeData(parameterizedRootId)).to.deep.eq({ three: { id: 31 } });
      });

      it(`allows removal of values containing a field`, () => {
        const updated = write(context, snapshot, nestedQuery, {
          one: {
            two: null,
          },
        }).snapshot;

        expect(updated.getNodeData(parameterizedRootId)).to.deep.eq(null);
      });

    });

    describe(`writing an entity with nested indirect fields in an array`, () => {

      let nestedQuery: RawOperation, snapshot: GraphSnapshot, parameterizedRootId: NodeId;
      let entityId1: NodeId, entityId2: NodeId;
      let parameterizedIdInEntity1: NodeId, parameterizedIdInEntity2: NodeId;
      beforeAll(() => {
        nestedQuery = query(`query nested($id: ID!) {
          one {
            two(id: $id) {
              three {
                id
                four(extra: true) {
                  five
                }
              }
            }
          }
        }`, { id: 1 });

        parameterizedRootId = nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
        entityId1 = '31';
        entityId2 = '32';
        parameterizedIdInEntity1 = nodeIdForParameterizedValue(entityId1, ['four'], { extra: true });
        parameterizedIdInEntity2 = nodeIdForParameterizedValue(entityId2, ['four'], { extra: true });

        snapshot = write(context, empty, nestedQuery, {
          one: {
            two: [
              {
                three: {
                  id: 31,
                  four: { five: 1 },
                },
              },
              {
                three: {
                  id: 32,
                  four: { five: 1 },
                },
              },
            ],
          },
        }).snapshot;
      });

      it(`writes a value snapshot for the containing field`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedRootId)).to.exist;
      });

      it(`writes entity snapshots for each array entry`, () => {
        expect(snapshot.getNodeSnapshot(entityId1)).to.exist;
        expect(snapshot.getNodeSnapshot(entityId2)).to.exist;
      });

      it(`writes entity snapshots for each parameterized field of array entry`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedIdInEntity1)).to.exist;
        expect(snapshot.getNodeSnapshot(parameterizedIdInEntity2)).to.exist;
      });

      it(`references the parent entity snapshot from the parameterized field`, () => {
        const entry1 = snapshot.getNodeSnapshot(parameterizedIdInEntity1)!;
        expect(entry1.inbound).to.have.deep.members([{ id: entityId1, path: ['four'] }]);

        const entry2 = snapshot.getNodeSnapshot(parameterizedIdInEntity2)!;
        expect(entry2.inbound).to.have.deep.members([{ id: entityId2, path: ['four'] }]);
      });

      it(`references the parameterized field children from the parent entity`, () => {
        const entity1 = snapshot.getNodeSnapshot(entityId1)!;
        expect(entity1.outbound).to.have.deep.members([
          { id: parameterizedIdInEntity1, path: ['four'] },
        ]);

        const entity2 = snapshot.getNodeSnapshot(entityId2)!;
        expect(entity2.outbound).to.have.deep.members([
          { id: parameterizedIdInEntity2, path: ['four'] },
        ]);
      });

      it(`references the children from the parameterized root`, () => {
        const container = snapshot.getNodeSnapshot(parameterizedRootId)!;

        expect(container.outbound).to.have.deep.members([
          { id: entityId1, path: [0, 'three'] },
          { id: entityId2, path: [1, 'three'] },
        ]);
      });

      it(`writes an array with the correct length`, () => {
        // This is a bit arcane, but it ensures that _overlayParameterizedValues
        // behaves properly when iterating arrays that contain _only_
        // parameterized fields.
        expect(snapshot.getNodeData(parameterizedRootId)).to.deep.eq([
          {
            three: { id: 31 },
          },
          {
            three: { id: 32 },
          },
        ]);
      });

      it(`allows removal of values containing a field`, () => {
        const updated = write(context, snapshot, nestedQuery, {
          one: {
            two: null,
          },
        }).snapshot;

        expect(updated.getNodeData(parameterizedRootId)).to.deep.eq(null);
      });

    });

    describe(`writing nested indirect fields contained in an array`, () => {

      let nestedQuery: RawOperation, snapshot: GraphSnapshot, containerId: NodeId;
      beforeAll(() => {
        nestedQuery = query(`query nested($id: ID!) {
          one {
            two(id: $id) {
              three {
                threeValue
              }
            }
          }
        }`, { id: 1 });

        containerId = nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });

        snapshot = write(context, empty, nestedQuery, {
          one: {
            two: [
              {
                three: {
                  threeValue: 'first',
                },
              },
              {
                three: {
                  threeValue: 'second',
                },
              },
            ],
          },
        }).snapshot;
      });

      it(`no references from the parent`, () => {
        const container = snapshot.getNodeSnapshot(containerId)!;
        expect(container.outbound).to.eq(undefined);
      });

      it(`writes an array with the correct length`, () => {
        // This is a bit arcane, but it ensures that _overlayParameterizedValues
        // behaves properly when iterating arrays that contain _only_
        // parameterized fields.
        expect(snapshot.getNodeData(containerId)).to.deep.eq([
          {
            three: {
              threeValue: 'first',
            },
          },
          {
            three: {
              threeValue: 'second',
            },
          },
        ]);
      });

      it(`allows removal of values containing a field`, () => {
        const updated = write(context, snapshot, nestedQuery, {
          one: {
            two: [
              null,
              {
                three: {
                  threeValue: 'second',
                },
              },
            ],
          },
        }).snapshot;

        expect(updated.getNodeData(containerId)).to.deep.eq([
          null,
          {
            three: {
              threeValue: 'second',
            },
          },
        ]);
      });

    });

    describe(`with nested entities in an array`, () => {

      let nestedQuery: RawOperation, snapshot: GraphSnapshot, containerId: NodeId;
      beforeAll(() => {
        nestedQuery = query(`query nested($id: ID!) {
          one {
            two(id: $id) {
              three { id }
            }
          }
        }`, { id: 1 });

        containerId = nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });

        snapshot = write(context, empty, nestedQuery, {
          one: {
            two: [
              { three: { id: 1 } },
              { three: { id: 2 } },
            ],
          },
        }).snapshot;
      });

      it(`writes a value snapshot for the containing field`, () => {
        expect(snapshot.getNodeSnapshot(containerId)).to.exist;
      });

      it(`writes value snapshots for each array entry`, () => {
        expect(snapshot.getNodeSnapshot('1')).to.exist;
        expect(snapshot.getNodeSnapshot('2')).to.exist;
      });

      it(`references the parent snapshot from the children`, () => {
        const entry1 = snapshot.getNodeSnapshot('1')!;
        const entry2 = snapshot.getNodeSnapshot('2')!;

        expect(entry1.inbound).to.have.deep.members([{ id: containerId, path: [0, 'three'] }]);
        expect(entry2.inbound).to.have.deep.members([{ id: containerId, path: [1, 'three'] }]);
      });

      it(`references the children from the parent`, () => {
        const container = snapshot.getNodeSnapshot(containerId)!;

        expect(container.outbound).to.have.deep.members([
          { id: '1', path: [0, 'three'] },
          { id: '2', path: [1, 'three'] },
        ]);
      });

      it.skip(`allows shifting from the front`, () => {
        const updated = write(context, snapshot, nestedQuery, {
          one: {
            two: [
              { three: { id: 2 } },
            ],
          },
        }).snapshot;

        expect(updated.getNodeSnapshot(containerId)!.outbound).to.have.deep.members([
          { id: '2', path: [0, 'three'] },
        ]);

        expect(updated.getNodeSnapshot('2')!.inbound).to.have.deep.members([
          { id: containerId, path: [0, 'three'] },
        ]);
      });

    });

    describe(`optional arguments`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(
          `query getAFoo($one: Number, $two: String) {
            foo(a: $one, b:$two)
          }`, { one: 1 }
        );

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { a: 1, b: null });

        const result = write(context, empty, parameterizedQuery, { foo: 'hello' });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`writes a node for the field`, () => {
        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq('hello');
      });

      it(`creates an outgoing reference from the field's container`, () => {
        const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
        expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: ['foo'] }]);
      });

      it(`creates an inbound reference to the field's container`, () => {
        const values = snapshot.getNodeSnapshot(parameterizedId)!;
        expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: ['foo'] }]);
      });

      it(`does not expose the parameterized field directly from its container`, () => {
        expect(_.get(snapshot.getNodeData(QueryRootId), 'foo')).to.eq(undefined);
      });

      it(`marks only the new field as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
      });

      it(`emits a ParameterizedValueSnapshot`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceOf(ParameterizedValueSnapshot);
      });

    });

    describe(`default arguments`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>, parameterizedId: NodeId;
      beforeAll(() => {
        const parameterizedQuery = query(`query getAFoo($one: Number = 123, $two: String = "stuff") {
          foo(a: $one, b:$two)
        }`);

        parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { a: 123, b: 'stuff' });

        const result = write(context, empty, parameterizedQuery, { foo: 'hello' });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`writes a node for the field`, () => {
        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq('hello');
      });

      it(`creates an outgoing reference from the field's container`, () => {
        const queryRoot = snapshot.getNodeSnapshot(QueryRootId)!;
        expect(queryRoot.outbound).to.deep.eq([{ id: parameterizedId, path: ['foo'] }]);
      });

      it(`creates an inbound reference to the field's container`, () => {
        const values = snapshot.getNodeSnapshot(parameterizedId)!;
        expect(values.inbound).to.deep.eq([{ id: QueryRootId, path: ['foo'] }]);
      });

      it(`does not expose the parameterized field directly from its container`, () => {
        expect(_.get(snapshot.getNodeData(QueryRootId), 'foo')).to.eq(undefined);
      });

      it(`marks only the new field as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([parameterizedId]);
      });

      it(`emits a ParameterizedValueSnapshot`, () => {
        expect(snapshot.getNodeSnapshot(parameterizedId)).to.be.an.instanceOf(ParameterizedValueSnapshot);
      });

    });

    describe.skip(`removing array nodes that contain parameterized values`, () => {

      let rootedQuery: RawOperation, snapshot: GraphSnapshot, entityBarId0: NodeId, entityBarId1: NodeId;
      beforeAll(() => {
        rootedQuery = query(`{
          foo {
            bar(extra: true) {
              baz { id }
            }
          }
        }`);

        entityBarId0 = nodeIdForParameterizedValue(QueryRootId, ['foo', 0, 'bar'], { extra: true });
        entityBarId1 = nodeIdForParameterizedValue(QueryRootId, ['foo', 1, 'bar'], { extra: true });

        const { snapshot: baseSnapshot } = write(context, empty, rootedQuery, {
          foo: [
            { bar: { baz: { id: 1 } } },
            { bar: { baz: { id: 2 } } },
          ],
        });

        const result = write(context, baseSnapshot, rootedQuery, {
          foo: [
            { bar: { baz: { id: 1 } } },
          ],
        });
        snapshot = result.snapshot;
      });

      it(`doesn't contain the orphaned parameterized value`, () => {
        expect(snapshot.allNodeIds()).to.not.include(entityBarId1);
      });

      it(`doesn't contain transitively orphaned nodes`, () => {
        expect(snapshot.allNodeIds()).to.not.include('2');
      });

    });
  });

});
