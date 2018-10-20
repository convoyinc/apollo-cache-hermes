import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { strictConfig } from '../../../helpers/context';

describe(`writeFragment`, () => {

  let hermes: Hermes;
  beforeAll(() => {
    hermes = new Hermes(new CacheContext(strictConfig));
    hermes.writeQuery({
      query: gql(`
        query getViewer {
          viewer {
            id
            name
            __typename
            trucks(number: 2) {
              name
              year
            }
          }
        }
      `),
      data: {
        viewer: {
          id: 123,
          name: 'Gouda',
          __typename: 'Viewer',
          trucks: {
            name: 'truck0',
            year: '1998',
          },
        },
      },
    });
  });

  it(`throws an error when trying to convert from list to non-list`, () => {
    expect(() => {
      hermes.writeFragment({
        id: '123',
        fragment: gql(`
          fragment viewer on Viewer {
            id
            trucks(number: 2) {
              name
              year
              driverName
            }
          }
        `),
        data: {
          id: 123,
          trucks: [
            {
              name: 'truck0',
              year: '1998',
              driverName: 'Bob',
            },
          ],
        },
      });
    }).toThrow(/Unsupported transition from a non-list to list value/i);
  });

});
