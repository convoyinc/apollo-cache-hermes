import { extract } from '../../../../../src/operations/extract';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`nested references in an array hanging off of a root`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: {
              three: { id: 0 },
            },
          },
        },
        `{ 
            one {
              two {
                three { id }
              }
            }
        }`,
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extract Json serialization object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          inbound: null,
          outbound: [{ id: 0, path: ['one', 'two', 'three'] }],
          data: {
            one: {
              two: null,
            },
          },
        },
        '0': {
          inbound: [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
          outbound: null,
          data: { id: 0 },
        },
      });
    });

  });
});
