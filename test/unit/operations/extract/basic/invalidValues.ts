import { extract } from '../../../../../src/operations/extract';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`invalid values`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        { nan: NaN, func: (() => {}) as any },
        `{ nan, func}`
      ).snapshot;
    });

    it(`throws error when extracting invalid values`, () => {
      expect(() => {
        extract(snapshot);
      }).to.throw(/unserializable/);
    });

  });
});
