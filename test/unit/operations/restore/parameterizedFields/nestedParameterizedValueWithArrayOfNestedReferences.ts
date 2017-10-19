import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { extract, restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`nested parameterized value with array of nested references`, () => {

    const parameterizedTopContainerId = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two'],
      { id: 1 }
    );

    const nestedParameterizedValueId0 = nodeIdForParameterizedValue(
      '31',
      ['four'],
      { extra: true },
    );

    const nestedParameterizedValueId1 = nodeIdForParameterizedValue(
      '32',
      ['four'],
      { extra: true },
    );

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
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
          {
            one: {
              two: [],
            },
          },
          /* inbound */ undefined,
          [{ id: parameterizedTopContainerId, path: ['one', 'two'] }]
        )
      );
    });

    it(`restores parameterized RootQuery NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new ParameterizedValueSnapshot(
          [
            { three: {} },
            { three: {} },
          ],
          [{ id: QueryRootId, path: ['one', 'two'] }],
          [
            { id: '31', path: ['0', 'three'] },
            { id: '32', path: ['1', 'three'] },
          ]
        )
      );
    });

    it(`restores id=31 NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot('31')).to.deep.eq(
        new EntitySnapshot(
          {
            id: 31,
          },
          [{ id: parameterizedTopContainerId, path: ['0', 'three'] }],
          [{ id: nestedParameterizedValueId0, path: ['four'] }]
        )
      );
    });

    it(`restores nested parameterized NodeSnapshot in id=31 from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(nestedParameterizedValueId0)).to.deep.eq(
        new ParameterizedValueSnapshot(
          { five: 1 },
          [{ id: '31', path: ['four'] }],
          /* outbound */ undefined
        )
      );
    });

    it(`restores id=32 NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot('32')).to.deep.eq(
        new EntitySnapshot(
          {
            id: 32,
          },
          [{ id: parameterizedTopContainerId, path: ['1', 'three'] }],
          [{ id: nestedParameterizedValueId1, path: ['four'] }]
        )
      );
    });

    it(`restores nested parameterized NodeSnapshot in id=32 from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(nestedParameterizedValueId1)).to.deep.eq(
        new ParameterizedValueSnapshot(
          { five: 1 },
          [{ id: '32', path: ['four'] }],
          /* outbound */ undefined
        )
      );
    });

  });
});
