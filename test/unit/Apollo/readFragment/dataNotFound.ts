import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { strictConfig } from '../../../helpers/context';

describe(`Hermes Apollo API`, () => {
  describe(`readFragment and data is not found`, () => {

    let hermes: Hermes;
    beforeAll(() => {
      hermes = new Hermes(new CacheContext(strictConfig));
    });

    it(`correctly return undefined when data is not found`, () => {
      expect(hermes.readFragment({
        id: '123',
        fragment: gql(`
          fragment viewer on Viewer {
            id
            name
          }
        `),
      })).to.be.eq(undefined);
    });

  });
});
