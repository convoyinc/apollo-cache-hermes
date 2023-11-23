import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { strictConfig } from '../../../helpers/context';

describe(`writeFragment with no fragment`, () => {

  let hermes: Hermes;
  beforeAll(() => {
    hermes = new Hermes(strictConfig);
  });

  it(`throws an error`, () => {
    expect(() => {
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
    }).to.throw(/An error occurred! For more details, see the full error text at /i);
  });

});
