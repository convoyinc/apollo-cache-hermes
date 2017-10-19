import { extract } from '../../../../../src/operations/extract';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`falsy values`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        { null: null, false: false, zero: 0, string: '' },
        `{ null, false, zero, string }`
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extracts JSON serializable object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          data: { null: null, false: false, zero: 0, string: '' },
        },
      });
    });

  });
});
