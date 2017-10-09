import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { QueryResult, read, write } from '../../../../src/operations';
import { query, silentConfig } from '../../../helpers';

describe(`operations.read`, () => {

  const context = new CacheContext(silentConfig);
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

  describe(`incomplete payload`, () => {

    let snapshot: GraphSnapshot;
    let readResult: QueryResult;

    beforeAll(() => {
      snapshot = write(context, empty, shipmentsQuery, {
        shipments: [
          {
            id: '0',
            driver: {
              name: 'Bob',
              id: 'Bob-d0',
              messages: [
                { details: 'Hello' },
                { details: 'world' },
              ],
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
          {
            driver: {
            },
          },
        ],
      }).snapshot;
      readResult = read(context, shipmentsQuery, snapshot);
    });

    it(`verify that read result is complete`, () => {
      expect(readResult.complete).to.eq(true);
    });

    it(`verify that read result is correct`, () => {
      expect(readResult.result).to.deep.eq({
        shipments: [
          {
            id: '0',
            driver: {
              name: 'Bob',
              id: 'Bob-d0',
              messages: [
                { details: 'Hello' },
                { details: 'world' },
              ],
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
          {
            id: null,
            driver: {
              name: null,
              id: null,
              messages: null,
            },
            stopEtaSummary: null,
          },
        ],
      });
    });

  });

});
