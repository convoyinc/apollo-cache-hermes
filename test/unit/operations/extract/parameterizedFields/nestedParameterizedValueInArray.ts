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
                  name: 'Foo',
                  extra: false,
                },
              },
              {
                baz: {
                  name: 'Foo1',
                  extra: true,
                },
              },
            ],
          },
        },
        `query getAFoo($id: ID!) {
          foo {
            bar {
              baz(id: $id, withExtra: true) {
                name extra
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
              bar: [],
            },
          },
        },
        [parameterizedContainersId0]: {
          inbound: [{ id: QueryRootId, path: ['foo', 'bar', 0, 'baz'] }],
          outbound: null,
          data: {
            baz: {
              name: 'Foo',
              extra: false,
            },
          },
        },
        [parameterizedContainersId1]: {
          inbound: [{ id: QueryRootId, path: ['foo', 'bar', 1, 'baz'] }],
          outbound: null,
          data: {
            baz: {
              name: 'Foo1',
              extra: true,
            },
          },
        },
      });
    });

  });
});
