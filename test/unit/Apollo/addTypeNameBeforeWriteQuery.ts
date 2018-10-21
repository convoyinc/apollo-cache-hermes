import gql from 'graphql-tag';

import { Hermes }  from '../../../src/apollo/Hermes';
import { strictConfig } from '../../helpers';

describe(`transform document before writeQuery`, () => {

  let hermes: Hermes;
  beforeAll(() => {
    hermes = new Hermes({
      ...strictConfig,
      addTypename: true,
    });
    hermes.writeQuery({
      query: gql(`
        query getViewer {
          viewer {
            id
            name
          }
        }
      `),
      data: {
        viewer: {
          id: 0,
          name: 'Gouda',
          __typename: 'Viewer',
        },
      },
    });

  });

  it(`correctly writeQuery with __typename`, () => {
    expect(hermes.readQuery({
      query: gql(`
        query getViewer {
          viewer {
            id
            name
          }
        }
      `),
    })).toEqual({
      viewer: {
        id: 0,
        name: 'Gouda',
        __typename: 'Viewer',
      },
    });
  });

});
