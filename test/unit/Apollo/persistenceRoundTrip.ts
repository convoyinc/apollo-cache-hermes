import gql from 'graphql-tag';

import { Hermes }  from '../../../src/apollo/Hermes';
import { StaticNodeId } from '../../../src/schema';
import { strictConfig } from '../../helpers';

const baseResourcesV1 = `query baseResournces {
  viewer {
    id
    name
  }
}`;

const baseResourcesV2 = `query baseResournces {
  viewer {
    id
    name
    age
  }
}`;

describe(`extract/restore roundtrip`, () => {

  let persisted: string;
  beforeAll(() => {
    const hermes = new Hermes({
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
          history {
            id
            incident
          }
        }
      `),
      result: {
        viewer: {
          id: 0,
          name: 'Gouda',
          __typename: 'Viewer',
        },
        history: [{
          id: 'a',
          incident: 'power outage',
          __typename: 'HistoryEntry',
        }, {
          id: 'b',
          incident: 'fire',
          __typename: 'HistoryEntry',
        }],
      },
      dataId: StaticNodeId.QueryRoot,
    });

    persisted = JSON.stringify(hermes.extract(false, { query: gql(baseResourcesV1), optimistic: false }));
  });

  it(`throws if schema changed but no migration map is provided on restore`, () => {
    const hermes = new Hermes({
      ...strictConfig,
      addTypename: true,
    });

    jestExpect(() => {
      hermes.restore(JSON.parse(persisted), undefined, {
        query: gql(baseResourcesV2),
        optimistic: false,
      });
    }).toThrow();
  });

  it(`extracted data is pruned according to the prune query`, () => {
    const hermes = new Hermes({
      ...strictConfig,
      addTypename: true,
    });

    jestExpect(() => {
      hermes.restore(JSON.parse(persisted), {
        _entities: {
          Viewer: {
            age: _previous => '',
          },
        },
      }, {
        query: gql(baseResourcesV2),
        optimistic: false,
      });
    }).not.toThrow();

    jestExpect(() => {
      hermes.readQuery({
        query: gql(`
          query getViewer {
            history {
              id
              incident
            }
          }
        `),
      });
    }).toThrow(/read not satisfied by the cache/i);

  });

  it(`restored data is migrated and can satified query for v2 base resources`, () => {
    const hermes = new Hermes({
      ...strictConfig,
      addTypename: true,
    });

    jestExpect(() => {
      hermes.restore(JSON.parse(persisted), {
        _entities: {
          Viewer: {
            age: _previous => '',
          },
        },
      }, {
        query: gql(baseResourcesV2),
        optimistic: false,
      });
    }).not.toThrow();

    jestExpect(hermes.readQuery({
      query: gql(baseResourcesV2),
    })).toEqual({
      viewer: {
        id: 0,
        age: '',
        name: 'Gouda',
        __typename: 'Viewer',
      },
    });

  });

});
