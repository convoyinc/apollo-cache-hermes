import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes/EntitySnapshot';
import { extract, restore } from '../../../../../src/operations';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`simple references hanging off a root`, () => {

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          viewer: {
            id: 123,
            name: 'Gouda',
          },
        },
        `{ viewer { id name } }`
      ).snapshot;

      restoreResult = restore(extract(snapshot));
    });

    it(`restores RootQuery JSON serializable object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          { id: 123, name: 'Gouda' },
          /* inbound */ undefined,
          [{ id: '123', path: ['viewer'] }],
        )
      );
    });

    it(`restores id='123' JSON serializable object`, () => {
      expect(restoreResult.getNodeSnapshot('123')).to.deep.eq(
        new EntitySnapshot(
          { id: 123, name: 'Gouda' },
          [{ id: QueryRootId, path: ['viewer'] }],
          /* outbound */ undefined
        )
      );
    });

  });
});
