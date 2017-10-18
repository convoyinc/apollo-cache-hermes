import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { write } from '../../../../../src/operations/write';
import { NodeId, RawOperation, StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`nested parameterized value with array of nested references`, () => {

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
});
