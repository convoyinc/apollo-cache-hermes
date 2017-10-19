import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { extract, restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`nested parameterized value`, () => {

    const parameterizedId = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two', 'three'],
      { id: 1, withExtra: true }
    );

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: {
              three: {
                name: 'ThreeValue',
                extraValue: 42,
              },
            },
          },
        },
        `query getAFoo($id: ID!) {
          one {
            two {
              three(id: $id, withExtra: true) {
                name extraValue
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
          [{ id: parameterizedId, path: ['one', 'two', 'three'] }]
        )
      );
    });

    it(`restores parameterized RootQuery NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(parameterizedId)).to.deep.eq(
        new ParameterizedValueSnapshot(
          {
            name: 'ThreeValue',
            extraValue: 42,
          },
          [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          /* outbound */ undefined
        )
      );
    });

  });
});
