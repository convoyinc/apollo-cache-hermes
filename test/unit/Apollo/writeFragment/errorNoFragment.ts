import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { strictConfig } from '../../../helpers/context';

describe(`writeFragment with no fragment`, () => {

  let hermes: Hermes;
  beforeAll(() => {
    hermes = new Hermes(new CacheContext(strictConfig));
  });

  it(`throws an error`, () => {
    jestExpect(() => {
      hermes.writeFragment({
        id: '123',
        fragment: gql(`
          query viewer {
            id
            name
          }
        `),
        data: {
          id: 123,
          name: 'Gouda',
          __typename: 'Viewer',
        },
      });
    }).toThrow(/No operations are allowed when using a fragment as a query/i);
  });

});
