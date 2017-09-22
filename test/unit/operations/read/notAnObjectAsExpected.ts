import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { read, write, QueryResult } from '../../../../src/operations';
import { query, strictConfig } from '../../../helpers';

describe(`operations.read`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const shipmentsQuery = query(`{
    shipments {
      id
      driver {
        name
        id
        messages(count: 2) {
          details
        }
      }
      stopEtaSummary(limit: 2) {
        id
        type
      }
    }
  }`);

  describe.skip(`not an object as expected`, () => {

    let readResult: QueryResult, snapshot: GraphSnapshot;
    beforeAll(() => {
      snapshot = write(context, empty, shipmentsQuery, {
        shipments: [
          {
            id: '0',
            driver: {
              name: 'Joe',
              id: 'Joe-d1',
              messages: 'string',
            },
            stopEtaSummary: [
              {
                id: 'eta0',
                type: 'warning',
              },
              {
                id: 'eta1',
                type: 'warning',
              },
            ],
          },
          {
            id: '1',
            driver: {
              name: 'Joe',
              id: 'Joe-d1',
              messages: [
                { details: 'Hello' },
              ],
            },
            stopEtaSummary: [
              {
                id: 'eta0',
                type: 'warning',
              },
            ],
          },
        ],
      }).snapshot;
    });

    it(`verify that error is reported`, () => {
      expect(() => {
        read(context, shipmentsQuery, snapshot);
      }).to.throw(
        `Hermes Error: At field-"messages",\n  expected an object or array as a payload but get ""string""`);
    });


    it(`verify that read result is complete`, () => {
      expect(readResult.complete).to.eq(true);
    });

    it(`verify that read result is correct`, () => {
      expect(readResult.result).to.eq({
        shipments: [
          {
            id: '0',
            driver: null,
            stopEtaSummary: [
              {
                id: 'eta0',
                type: 'warning',
              },
              {
                id: 'eta1',
                type: 'warning',
              },
            ],
          },
          {
            id: '1',
            driver: {
              name: 'Joe',
              id: 'Joe-d1',
              messages: [
                { details: 'Hello' },
              ],
            },
            stopEtaSummary: [
              {
                id: 'eta0',
                type: 'warning',
              },
            ],
          },
        ],
      });
    });
  });
});
