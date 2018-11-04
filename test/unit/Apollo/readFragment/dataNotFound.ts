import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { strictConfig } from '../../../helpers/context';

describe(`readFragment with no matching data`, () => {

  let hermes: Hermes;
  beforeAll(() => {
    hermes = new Hermes(new CacheContext(strictConfig));
  });

  it(`correctly returns undefined`, () => {
    jestExpect(hermes.readFragment({
      id: '123',
      fragment: gql(`
        fragment viewer on Viewer {
          id
          name
        }
      `),
    })).toBe(undefined);
  });

});
