import { extract } from '../../../../../src/operations/extract';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.serialization`, () => {
  describe(`simple references hanging off a root`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          bar: {
            id: 123,
            name: 'Gouda',
          },
          foo: {
            id: 456,
            name: 'Brie',
          },
        },
        `{
          bar { id name }
          foo { id name }
        }`
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extract Json serializable object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          outbound: [{ id: 123, path: ['bar'] }, { id: 456, path: ['foo'] }],
          inbound: null,
          data: null,
        },
        '123': {
          outbound: null,
          inbound: [{ id: QueryRootId, path: ['bar'] }],
          data: { id: 123, name: 'Gouda' },
        },
        '456': {
          outbound: null,
          inbound: [{ id: QueryRootId, path: ['foo'] }],
          data: { id: 456, name: 'Brie' },
        },
      });
    });

  });
});
