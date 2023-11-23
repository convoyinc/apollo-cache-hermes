import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { strictConfig } from '../../../helpers/context';

describe(`readFragment with no matching data`, () => {

  let hermes: Hermes;
  beforeAll(() => {
    hermes = new Hermes(strictConfig);
  });

  it(`correctly returns null`, () => {
    expect(hermes.readFragment({
      id: '123',
      fragment: gql(`
        fragment viewer on Viewer {
          id
          name
        }
      `),
    })).to.be.eq(null);
  });

});
