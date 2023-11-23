import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { strictConfig } from '../../../helpers/context';
import { StaticNodeId } from '../../../../src/schema';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`writeFragment with missing __typename`, () => {

  let hermes: Hermes;
  beforeAll(() => {
    hermes = new Hermes({
      ...strictConfig,
      addTypename: true,
    });
  });

  it(`does not throw an error`, () => {
    expect(
      hermes.writeFragment({
        id: QueryRootId,
        fragment: gql(`
          fragment viewer on Viewer {
            id
            name
          }
        `),
        data: {
          id: 123,
          name: 'Gouda',
        },
      })
    ).to.deep.equal({ __ref: 'ROOT_QUERY' });
  });

});
