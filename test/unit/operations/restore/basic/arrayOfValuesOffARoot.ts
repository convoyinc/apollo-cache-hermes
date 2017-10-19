import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
import { extract, restore } from '../../../../../src/operations';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`new array of values hanging off of a root`, () => {

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          viewer: [
            {
              postal: 123,
              name: 'Gouda',
            },
            {
              postal: 456,
              name: 'Brie',
            },
          ],
        },
        `{ viewer { postal name } }`
      ).snapshot;

      restoreResult = restore(extract(snapshot));
    });

    it(`restores RootQuery NodeSnapshot from JSON serializable object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          {
            viewer: [
              {
                postal: 123,
                name: 'Gouda',
              },
              {
                postal: 456,
                name: 'Brie',
              },
            ],
          },
          /* inbound */ undefined,
          /* outbound */ undefined,
        )
      );
    });

  });
});
