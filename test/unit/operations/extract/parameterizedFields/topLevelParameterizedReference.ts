import { extract } from '../../../../../src/operations/extract';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializeable } from '../../../../../src/primitive';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`top-level parameterized reference`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          foo: {
            id: 1,
            name: 'Foo',
            extra: false,
          },
        },
        `query getAFoo($id: ID!) {
          foo(id: $id, withExtra: true) {
            id name extra
          }
        }`,
        { id: 1 }
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extract Json serialization object`, () => {
      const parameterizedContainerId = nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1 });
      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          inbound: null,
          outbound: [{ id: parameterizedContainerId, path: ['foo'] }],
          data: null,
        },
        [parameterizedContainerId]: {
          inbound: [{ id: parameterizedContainerId, path: ['foo'] }],
          outbound: [{ id: '1', path: [] }],
          data: null,
        },
        '1': {
          inbound: [{ id: QueryRootId, path: ['foo'] }],
          outbound: null,
          data: {
            id: 1,
            name: 'Foo',
            extra: false,
          },
        },
      });
    });

  });
});
