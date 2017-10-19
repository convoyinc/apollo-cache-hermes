import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
import { extract, restore } from '../../../../../src/operations';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`simple leaf-values hanging off a root`, () => {

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        { foo: 123, bar: 'asdf' },
        `{ foo bar }`
      ).snapshot;

      restoreResult = restore(extract(snapshot));
    });

    it(`restores RootQuery JSON serializable object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          { foo: 123, bar: 'asdf' },
          /* inbound */ undefined,
          /* outbound */ undefined,
        )
      );
    });

  });
});
