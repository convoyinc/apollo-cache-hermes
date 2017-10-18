import { extract } from '../../../../../src/operations/extract';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`nested references in an array`, () => {

    let extractResult: Serializeable.GraphSnapshot;
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

      extractResult = extract(snapshot);
    });

    it(`extract Json serialization object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          data: {
            one: {
              two: [
                { three: { name: 'Gouda' } },
                { three: { name: 'Brie' } },
              ],
            },
          },
        },
      });
    });

  });
});
