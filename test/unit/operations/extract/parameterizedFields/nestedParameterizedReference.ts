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
            bar: {
              baz: {
                id: 'baz0',
                name: 'Foo',
                extra: false,
              },
            },
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
      const parameterizedContainersId = nodeIdForParameterizedValue(
        QueryRootId,
        ['foo', 'bar', 'baz'],
        { id: 1 }
      );
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          inbound: null,
          outbound: [{ id: QueryRootId, path: ['foo', 'bar', 'baz'] }],
          data: {
            foo: {
              bar: {
                baz: null,
              },
            },
          },
        },
        [parameterizedContainersId]: {
          inbound: [{ id: QueryRootId, path: ['foo', 'bar', 'baz'] }],
          outbound: [{ id: 'baz0', path: [] }],
        },
        'baz0': {
          inbound: [],
          outbound: null,
          data: {
            id: 'baz0',
            name: 'Foo',
            extra: false,
          },
        },
      });
    });

  });
});
