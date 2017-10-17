import { extract } from '../../../../../src/operations/extract';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`simple leaf-values hanging off a root`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        { foo: {}, bar: [] },
        `{ foo bar }`
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extract Json serializable object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          outbound: null,
          inbound: null,
          data: { foo: {}, bar: [] },
        },
      });
    });

  });
});
