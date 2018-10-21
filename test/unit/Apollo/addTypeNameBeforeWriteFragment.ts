import gql from 'graphql-tag';

import { Hermes }  from '../../../src/apollo/Hermes';
import { nodeIdForParameterizedValue } from '../../../src/operations/SnapshotEditor';
import { StaticNodeId } from '../../../src/schema';
import { strictConfig } from '../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`transform document before writeFragmetn`, () => {

  let hermes: Hermes;
  beforeAll(() => {
    hermes = new Hermes({
      ...strictConfig,
      addTypename: true,
    });
    hermes.writeQuery({
      query: gql(`
        query getViewer {
          viewer(count: 2) {
            id
            name
          }
        }
      `),
      data: {
        viewer: [
          {
            id: 0,
            name: 'G.',
            __typename: 'Viewer',
          },
          {
            id: 1,
            name: 'M.',
            __typename: 'Viewer',
          },
        ],
      },
    });
    hermes.writeFragment({
      id: nodeIdForParameterizedValue(
        QueryRootId,
        ['viewer'],
        {
          count: 2,
        },
      ),
      fragment: gql(`
        fragment viewer on Viewer {
          id
          name
        }
      `),
      data: [
        {
          id: 0,
          name: 'Gouda',
          __typename: 'Viewer',
        },
        {
          id: 1,
          name: 'Munster',
          __typename: 'Viewer',
        },
      ],
    });
  });

  it(`correctly writeFragment with __typename`, () => {
    expect(hermes.readQuery({
      query: gql(`
      query getViewer {
        viewer(count: 2) {
          id
          name
        }
      }
      `),
    })).toEqual({
      viewer: [
        {
          id: 0,
          name: 'Gouda',
          __typename: 'Viewer',
        },
        {
          id: 1,
          name: 'Munster',
          __typename: 'Viewer',
        },
      ],
    });
  });

});
