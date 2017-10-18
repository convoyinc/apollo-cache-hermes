import { extract } from '../../../../src/operations/extract';
import { Serializeable } from '../../../../src/primitive';
import { StaticNodeId } from '../../../../src/schema';
import { createSnapshot } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`cyclic GraphSnapshot`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          foo: {
            id: 1,
            name: 'Foo',
            bar: {
              id: 2,
              name: 'Bar',
              fizz: { id: 1 },
              buzz: { id: 2 },
            },
          },
        },
        `{
          foo {
            id
            name
            bar {
              id
              name
              fizz { id }
              buzz { id }
            }
          }
        }`
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extract Json serialization object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: 1, path: ['foo'] }],
          data: {},
        },
        '1': {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [
            { id: QueryRootId, path: ['foo'] },
            { id: 2, path: ['fizz'] },
          ],
          outbound: [
            { id: 2, path: ['bar'] },
          ],
          data: { id: 1, name: 'Foo' },
        },
        '2': {
          nodeSnapshotType: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [
            { id: 1, path: ['bar'] },
            { id: 2, path: ['buzz'] },
          ],
          outbound: [
            { id: 1, path: ['fizz'] },
            { id: 2, path: ['buzz'] },
          ],
          data: { id: 2, name: 'Bar' },
        },
      });
    });

  });
});
