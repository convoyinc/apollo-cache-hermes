import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { extract, restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`nested parameterized references with parameterized value`, () => {

    const parameterizedId = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two'],
      { id: 1 }
    );

    const nestedParameterizedId = nodeIdForParameterizedValue(
      QueryRootId,
      ['31', 'four'],
      { extra: true }
    );

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: {
              three: {
                id: 31,
                four: { five: 1 },
              },
            },
          },
        },
        `query nested($id: ID!) {
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
        }`,
        { id: 1 }
      ).snapshot;

      restoreResult = restore(extract(snapshot));
    });

    it(`restores RootQuery NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          /* data */ undefined,
          /* inbound */ undefined,
          [{ id: parameterizedId, path: ['one', 'two'] }]
        )
      );
    });

    it(`restores parameterized NodeSnapshot from JSON serialization object`, () => {
      const parameterizedNode = restoreResult.getNodeSnapshot(parameterizedId)!;
      const entityData = restoreResult.getNodeData('31');

      expect(parameterizedNode).instanceOf(ParameterizedValueSnapshot);
      expect(parameterizedNode.inbound).to.has.members([{ id: QueryRootId, path: [] }]);
      expect(parameterizedNode.outbound).to.has.members([{ id: 31, path: ['three'] }]);
      expect(parameterizedNode.data).not.eq(undefined);
      expect(parameterizedNode.data!['three']).to.eq(entityData);
    });

    it(`restores id=31 NodeSnapshot from JSON serialization object`, () => {
      const entityNode = restoreResult.getNodeSnapshot('31')!;

      expect(entityNode).to.deep.eq(
        new EntitySnapshot(
          { id: 31 },
          [{ id: parameterizedId, path: ['three'] }],
          [{ id: nestedParameterizedId, path: ['four'] }]
        )
      );
    });

    it(`restores nested parameterized NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(nestedParameterizedId)).to.deep.eq(
        new ParameterizedValueSnapshot(
          { five: 1 },
          [{ id: parameterizedId, path: ['four'] }],
          /* outbound */ undefined
        )
      );
    });

  });
});
