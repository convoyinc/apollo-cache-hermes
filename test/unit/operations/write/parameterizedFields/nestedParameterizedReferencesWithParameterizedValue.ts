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

  describe(`nested parameterized references with parameterized value`, () => {

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

      entityId = '31';
      parameterizedRootId = nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
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
      jestExpect(snapshot.getNodeSnapshot(parameterizedRootId)).toBeDefined;
    });

    it(`writes value snapshots for each array entry`, () => {
      jestExpect(snapshot.getNodeSnapshot(parameterizedFieldId)).toBeDefined;
    });

    it(`references the parent entity snapshot from the children`, () => {
      const entry1 = snapshot.getNodeSnapshot(parameterizedFieldId)!;

      jestExpect(entry1.inbound).toEqual([{ id: entityId, path: ['four'] }]);
    });

    it(`references the children from the parent entity`, () => {
      const entity = snapshot.getNodeSnapshot(entityId)!;
      jestExpect(entity.outbound).toEqual([
        { id: parameterizedFieldId, path: ['four'] },
      ]);
    });

    it(`references the children from the parameterized root`, () => {
      const container = snapshot.getNodeSnapshot(parameterizedRootId)!;

      jestExpect(container.outbound).toEqual([
        { id: entityId, path: ['three'] },
      ]);
    });

    it(`writes an array with the correct length`, () => {
      // This is a bit arcane, but it ensures that _overlayParameterizedValues
      // behaves properly when iterating arrays that contain _only_
      // parameterized fields.
      jestExpect(snapshot.getNodeData(parameterizedRootId)).toEqual({ three: { id: 31 } });
    });

    it(`allows removal of values containing a field`, () => {
      const updated = write(context, snapshot, nestedQuery, {
        one: {
          two: null,
        },
      }).snapshot;

      jestExpect(updated.getNodeData(parameterizedRootId)).toEqual(null);
    });

  });
});
