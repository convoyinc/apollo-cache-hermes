import gql from 'graphql-tag';

import { Hermes }  from '../../../src/apollo/Hermes';
import { StaticNodeId } from '../../../src/schema';
import { strictConfig } from '../../helpers';

describe(`transform document before write`, () => {

  let hermes: Hermes;
  beforeAll(() => {
    hermes = new Hermes({
      ...strictConfig,
      addTypename: true,
    });
    hermes.write({
      query: gql(`
        query getViewer {
          viewer {
            id
            name
          }
        }
      `),
      result: {
        viewer: {
          id: 0,
          name: 'Gouda',
          __typename: 'Viewer',
        },
      },
      dataId: StaticNodeId.QueryRoot,
    });

  });

  it(`correctly write with __typename`, () => {
    expect(hermes.readQuery({
      query: gql(`
        query getViewer {
          viewer {
            id
            name
          }
        }
      `),
    })).to.deep.eq({
      viewer: {
        id: 0,
        name: 'Gouda',
        __typename: 'Viewer',
      },
    });
  });

});
