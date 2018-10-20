import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { strictConfig } from '../../../helpers/context';

describe(`writeFragment with parameterized references within arrays`, () => {

  let hermes: Hermes;
  beforeAll(() => {
    hermes = new Hermes(new CacheContext(strictConfig));
    hermes.writeQuery({
      query: gql(`
        query getViewer($city: String!, $area: String!) {
          viewer {
            id
            name
            __typename
            shipments(destination: $city) {
              id
              __typename
              address {
                street
                postal
              }
              shipper(operation: $area) {
                id
                __typename
              }
            }
          }
        }
      `),
      variables: {
        city: 'Seattle',
        area: 'PNW',
      },
      data: {
        viewer: {
          id: 123,
          name: 'Gouda',
          __typename: 'Viewer',
          shipments: [
            {
              id: 'shipment0',
              __typename: 'Shipment',
              address: {
                street: 'pike',
                postal: 98102,
              },
              shipper: {
                id: 'shipper0',
                __typename: 'Shipper',
              },
            },
            {
              id: 'shipment1',
              __typename: 'Shipment',
              address: {
                street: 'pine',
                postal: 98102,
              },
              shipper: {
                id: 'shipper1',
                __typename: 'Shipper',
              },
            },
          ],
        },
      },
    });
  });

  it(`returns parameterized data`, () => {
    expect(hermes.readFragment({
      id: '123',
      fragment: gql(`
      fragment viewer on Viewer {
        id
        name
        __typename
        shipments(destination: $city) {
          id
          address {
            street
            postal
          }
          shipper(operation: $area) {
            id
          }
        }
      }
    `),
      variables: {
        city: 'Seattle',
        area: 'PNW',
      },
    })).toEqual({
      id: 123,
      name: 'Gouda',
      __typename: 'Viewer',
      shipments: [
        {
          id: 'shipment0',
          __typename: 'Shipment',
          address: {
            street: 'pike',
            postal: 98102,
          },
          shipper: {
            id: 'shipper0',
            __typename: 'Shipper',
          },
        },
        {
          id: 'shipment1',
          __typename: 'Shipment',
          address: {
            street: 'pine',
            postal: 98102,
          },
          shipper: {
            id: 'shipper1',
            __typename: 'Shipper',
          },
        },
      ],
    });
  });

});
