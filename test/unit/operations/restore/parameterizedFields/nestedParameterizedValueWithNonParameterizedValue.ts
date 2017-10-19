import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { extract, restore } from '../../../../../src/operations';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`nested parameterized value`, () => {

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: {
              bee: 'BEEZ',
              three: {
                name: 'ThreeName',
                extraValue: 42,
              },
            },
          },
        },
        `query getAFoo($id: ID!) {
          one {
            two {
              bee
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
          {
            one: {
              two: {
                bee: 'BEEZ',
              },
            },
          },
          /* inbound */ undefined,
          [{ id: QueryRootId, path: ['one', 'two', 'three'] }]
        )
      );
    });

    it(`restores parameterized RootQuery NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new ParameterizedValueSnapshot(
          {
            name: 'ThreeName',
            extraValue: 42,
          },
          [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          /* outbound */ undefined
        )
      );
    });

  });
});
