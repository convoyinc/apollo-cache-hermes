import { restore } from '../../../../../src/operations';
import { Serializable, StaticNodeId } from '../../../../../src/schema';
import { createStrictCacheContext } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.restore`, () => {
  describe(`invalid NodeSnapshot type`, () => {

    it(`throws error when restore invalid NodeSnapshot type`, () => {
      expect(() => {
        const cacheContext = createStrictCacheContext();
        restore({
          [QueryRootId]: {
            type: Serializable.NodeSnapshotType.EntitySnapshot,
            outbound: [{ id: '1', path: ['foo'] }],
            data: { },
          },
          '1': {
            type: -1,
            data: {
              INVALID: 42,
            },
          },
        }, cacheContext);
      }).to.throw(/Invalid Serializable.NodeSnapshotType/i);
    });

  });
});
