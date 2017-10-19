import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { extract, restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`nested parameterized value`, () => {

    const parameterizedId0 = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two', 0, 'three'],
      { id: 1 }
    );

    const parameterizedId1 = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two', 1, 'three'],
      { id: 1 }
    );

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: [
              {
                three: {
                  name: 'Three0',
                  extra: false,
                },
              },
              {
                three: {
                  name: 'Three1',
                  extra: true,
                },
              },
            ],
          },
        },
        `query getAFoo($id: ID!) {
          one {
            two {
              three (id: $id, withExtra: true) {
                name extra
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
          {
            one: {
              two: [],
            },
          },
          /* inbound */ undefined,
          [
            { id: parameterizedId0, path: ['one', 'two', 0, 'three'] },
            { id: parameterizedId1, path: ['one', 'two', 1, 'three'] },
          ]
        )
      );
    });

    it(`restores parameterized NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(parameterizedId0)).to.deep.eq(
        new ParameterizedValueSnapshot(
          {
            three: {
              name: 'Three0',
              extra: false,
            },
          },
          [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
          /* outbound */ undefined
        )
      );
      expect(restoreResult.getNodeSnapshot(parameterizedId1)).to.deep.eq(
        new ParameterizedValueSnapshot(
          {
            three: {
              name: 'Three1',
              extra: false,
            },
          },
          [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
          /* outbound */ undefined
        )
      );
    });

  });
});
