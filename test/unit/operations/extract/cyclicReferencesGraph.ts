import { extract } from '../../../../src/operations/extract';
import { Serializable, StaticNodeId } from '../../../../src/schema';
import { createGraphSnapshot, createStrictCacheContext } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.extract`, () => {
  describe(`cyclic GraphSnapshot`, () => {

    let extractResult: Serializable.GraphSnapshot;
    beforeAll(() => {
      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
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
        }`,
        cacheContext
      );

      extractResult = extract(snapshot, cacheContext);
    });

    it(`extracts JSON serialization object`, () => {
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          outbound: [{ id: '1', path: ['foo'] }],
          data: {
            foo: undefined,
          },
        },
        '1': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [
            { id: QueryRootId, path: ['foo'] },
            { id: '2', path: ['fizz'] },
          ],
          outbound: [
            { id: '2', path: ['bar'] },
          ],
          data: {
            id: 1,
            name: 'Foo',
            bar: undefined,
          },
        },
        '2': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [
            { id: '1', path: ['bar'] },
            { id: '2', path: ['buzz'] },
          ],
          outbound: [
            { id: '1', path: ['fizz'] },
            { id: '2', path: ['buzz'] },
          ],
          data: {
            id: 2,
            name: 'Bar',
            fizz: undefined,
            buzz: undefined,
          },
        },
      });
    });

  });
});
