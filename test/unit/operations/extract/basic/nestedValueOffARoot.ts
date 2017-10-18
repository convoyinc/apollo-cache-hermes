import { extract } from '../../../../../src/operations/extract';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`<>`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          bar: {
            value: 42,
            prop1: 'hello',
            prop2: {
              nestedProp1: 1000,
              nestedProp2: 'world',
            },
          },
        },
        `{
          bar {
            value
            prop1
            prop2
          }
        }`
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extract Json serialization object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          data: {
            bar: {
              value: 42,
              prop1: 'hello',
              prop2: {
                nestedProp1: 1000,
                nestedProp2: 'world',
              },
            },
          },
        },
      });
    });

  });
});