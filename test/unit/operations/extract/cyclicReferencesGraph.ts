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
          inbound: null,
          outbound: null,
          data: null,
        },
        '1': {
          data: { id: 1, name: 'Foo' },
          inbound: [
            { id: 2, path: ['fizz'] },
          ],
          outbound: [],
        },
        '2': {
          data: { id: 2, name: 'Bar' },
          inbound: [
            { id: 2, path: ['buzz'] },
          ],
          outbound: [],
        },
      });
    });

  });
});
