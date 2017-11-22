import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { strictConfig } from '../../../helpers/context';

describe(`Hermes`, () => {
  describe(`writeFragment`, () => {

    let hermes: Hermes;
    beforeAll(() => {
      hermes = new Hermes(new CacheContext(strictConfig));
    });

    it(`throw an error when using multiple fragments without fragmentName`, () => {
      expect(() => {
        hermes.writeFragment({
          id: '123',
          fragment: gql(`
            fragment viewer on Viewer {
              id
              name
            }

            fragment shipment on Shipment {
              id
              name
              startLoc
              stopLoc
            }
          `),
          data: {
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
          },
        });
      }).to.throw(/Found 2 fragments. `fragmentName` must be provided/i);
    });

  });
});
