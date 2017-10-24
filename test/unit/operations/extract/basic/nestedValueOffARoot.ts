import { extract } from '../../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createOriginalGraphSnapshot, createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`nested values hanging off of a root`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createOriginalGraphSnapshot(
        {
          bar: {
            value: 42,
            prop1: 'hello',
            prop2: {
              nestedProp1: 1000,
              nestedProp2: 'world',
            },
            prop3: ['hello', 'world'],
          },
        },
        `{
          bar {
            value
            prop1
            prop2
            prop3
          }
        }`
      );

      extractResult = extract(snapshot, createStrictCacheContext());
    });

    it(`extracts JSON serialization object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          data: {
            bar: {
              value: 42,
              prop1: 'hello',
              prop2: {
                nestedProp1: 1000,
                nestedProp2: 'world',
              },
              prop3: ['hello', 'world'],
            },
          },
        },
      });
    });

  });
});
