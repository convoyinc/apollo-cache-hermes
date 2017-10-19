import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
import { extract, restore } from '../../../../../src/operations';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`nested references in an array`, () => {

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: [
              { three: { name: 'Gouda' } },
              { three: { name: 'Brie' } },
            ],
          },
        },
        `{ 
            one {
              two {
                three { name }
              }
            }
        }`,
      ).snapshot;

      restoreResult = restore(extract(snapshot));
    });

    it(`restores RootQuery JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          {
            one: {
              two: [
                { three: { name: 'Gouda' } },
                { three: { name: 'Brie' } },
              ],
            },
          },
          /* inbound */ undefined,
          /* outbound */ undefined,
        )
      );
    });

  });
});
