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
        seniority: tenure(unit: DAYS)
      }
      stopEtaSummary(limit: 2) {
        id
        type
      }
      vehicle: truck(index: 0) {
        capacity
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
              seniority: 10,
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
            vehicle: {
              capacity: 100,
            },
          },
          {
            id: '1',
            driver: {
              name: 'Joe',
              id: 'Joe-d1',
              messages: [
                { details: 'Hello' },
              ],
              seniority: 20,
            },
            stopEtaSummary: [
              {
                id: 'eta0',
                type: 'warning',
              },
            ],
            vehicle: {
              capacity: 200,
            },
          },
          {
            driver: {
            },
          },
        ],
      }).snapshot;
      readResult = read(context, shipmentsQuery, snapshot);
    });

    it(`verify that read result is incomplete`, () => {
      jestExpect(readResult.complete).toBe(false);
    });

    it(`verify that read result is correct`, () => {
      jestExpect(readResult.result).toEqual({
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
              seniority: 10,
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
            vehicle: {
              capacity: 100,
            },
          },
          {
            id: '1',
            driver: {
              name: 'Joe',
              id: 'Joe-d1',
              messages: [
                { details: 'Hello' },
              ],
              seniority: 20,
            },
            stopEtaSummary: [
              {
                id: 'eta0',
                type: 'warning',
              },
            ],
            vehicle: {
              capacity: 200,
            },
          },
          {
            driver: {},
          },
        ],
      });
    });

  });

});
