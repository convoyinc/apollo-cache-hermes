import { CacheContext } from '../../../../src/context';
import { QueryResult, read } from '../../../../src/operations';
import { query, silentConfig, createGraphSnapshot, createStrictCacheContext } from '../../../helpers';

describe(`operations.read`, () => {

  const context = new CacheContext(silentConfig);
  const readQuery = query(`
  query getShipment($id: ID!) {
    shipments(id: $id) {
      id
      driver {
        id
        name
      }
      charges {
        lineItems {
          id
          User: sourceUser {
            id
            name
          }
        }
      }
    }
  }`, { id: 0 });

  describe(`partial result in cache`, () => {

    let readResult: QueryResult;

    beforeAll(() => {

      const cacheContext = createStrictCacheContext();
      const snapshot = createGraphSnapshot(
        {
          shipments: [{
            id: '0',
            driver: {
              id: 'Bob-d0',
              name: 'Bob',
            },
          }],
        },
        `query getShipment($id: ID!) {
          shipments(id: $id) {
            id
            driver {
              id
              name
            }
          }
        }`,
        cacheContext,
        { id: 0 }
      );
      readResult = read(context, readQuery, snapshot);
    });

    it(`verify that read result is not complete`, () => {
      expect(readResult.complete).to.eq(false);
    });

    it(`verify that read result is correct`, () => {
      expect(readResult.result).to.deep.eq({
        shipments: [
          {
            id: '0',
            driver: {
              id: 'Bob-d0',
              name: 'Bob',
            },
            charges: undefined,
          },
        ],
      });
    });

  });

});
