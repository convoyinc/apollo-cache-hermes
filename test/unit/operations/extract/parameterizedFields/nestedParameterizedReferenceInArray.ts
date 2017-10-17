import { extract } from '../../../../../src/operations/extract';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`nested parameterized value`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          foo: {
            bar: [
              {
                baz: {
                  id: 'baz0',
                  name: 'BAZ0',
                  extra: false,
                },
              },
              {
                baz: {
                  id: 'baz1',
                  name: 'BAZ1',
                  extra: false,
                },
              },
            ],
          },
        },
        `query getAFoo($id: ID!) {
          foo {
            bar {
              baz(id: $id, withExtra: true) {
                id name extra
              }
            }
          }
        }`,
        { id: 1 }
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extract Json serialization object`, () => {
      const parameterizedContainersId0 = nodeIdForParameterizedValue(
        QueryRootId,
        ['foo', 'bar', 0, 'baz'],
        { id: 1 }
      );

      const parameterizedContainersId1 = nodeIdForParameterizedValue(
        QueryRootId,
        ['foo', 'bar', 1, 'baz'],
        { id: 1 }
      );

      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          inbound: null,
          outbound: [
            { id: QueryRootId, path: ['foo', 'bar', 0, 'baz'] },
            { id: QueryRootId, path: ['foo', 'bar', 1, 'baz'] },
          ],
          data: {
            foo: {
              bar: [
                { baz: null },
                { baz: null },
              ],
            },
          },
        },
        [parameterizedContainersId0]: {
          inbound: [{ id: QueryRootId, path: ['foo', 'bar', 0, 'baz'] }],
          outbound: [{ id: 'baz0', path: [] }],
        },
        'baz0': {
          inbound: [],
          outbound: null,
          data: {
            id: 'baz0',
            name: 'BAZ0',
            extra: false,
          },
        },
        [parameterizedContainersId1]: {
          inbound: [{ id: QueryRootId, path: ['foo', 'bar', 1, 'baz'] }],
          outbound: [{ id: 'baz0', path: [] }],
        },
        'baz1': {
          inbound: [],
          outbound: null,
          data: {
            id: 'baz1',
            name: 'BAZ1',
            extra: false,
          },
        },
      });
    });

  });
});
