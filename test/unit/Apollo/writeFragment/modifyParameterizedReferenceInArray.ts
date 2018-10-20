import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { EntitySnapshot } from '../../../../src/nodes/EntitySnapshot';
import { ParameterizedValueSnapshot } from '../../../../src/nodes/ParameterizedValueSnapshot';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { strictConfig } from '../../../helpers/context';

describe(`writeFragment with paramterized references in an array`, () => {

  let hermes: Hermes;
  const fragments = gql(`
    fragment shipper on Shipper {
      id
      email
    }

    fragment shipment on Shipment {
      id
      address {
        street
      }
      shipper(operation: $area) {
        id
        name
      }
    }
  `);

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

  it(`correctly update nested parameterized reference`, () => {
    hermes.writeFragment({
      id: 'shipment0',
      fragment: fragments,
      fragmentName: 'shipment',
      variables: {
        area: 'PNW',
      },
      data: {
        id: 'shipment0',
        address: {
          street: '4th & pike',
        },
        shipper: {
          id: 'shipper0',
          name: 'Munster',
        },
      },
    });

    const parameterizedShipmentId = nodeIdForParameterizedValue(
      '123',
      ['shipments'],
      { destination: 'Seattle' }
    );

    const parameterizedShipperId = nodeIdForParameterizedValue(
      'shipment0',
      ['shipper'],
      { operation: 'PNW' }
    );

    jestExpect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot('shipment0')).toEqual(
      new EntitySnapshot(
        {
          id: 'shipment0',
          __typename: 'Shipment',
          address: {
            street: '4th & pike',
            postal: 98102,
          },
        },
        [{ id: parameterizedShipmentId, path: [0] }],
        [{ id: parameterizedShipperId, path: ['shipper'] }],
      )
    );

    jestExpect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot(parameterizedShipperId)).toEqual(
      new ParameterizedValueSnapshot(
        {
          id: 'shipper0',
          __typename: 'Shipper',
          name: 'Munster',
        },
        [{ id: 'shipment0', path: ['shipper'] }],
        [{ id: 'shipper0', path: [] }]
      )
    );
  });

  it(`correctly update deeply nested reference`, () => {
    hermes.writeFragment({
      id: 'shipper0',
      fragment: fragments,
      fragmentName: 'shipper',
      data: {
        id: 'shipper0',
        email: 'munster@monsterInc.com',
      },
    });

    jestExpect(hermes.getCurrentCacheSnapshot().baseline.getNodeData('shipper0')).toEqual({
      id: 'shipper0',
      __typename: 'Shipper',
      name: 'Munster',
      email: 'munster@monsterInc.com',
    });
  });

  it(`correctly read cache after multiple writeFragments`, () => {
    jestExpect(hermes.readQuery({
      query: gql(`
      query readViewer($city: String!, $area: String!) {
        viewer {
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
      }
    `),
      variables: {
        city: 'Seattle',
        area: 'PNW',
      },
    })).toEqual({
      viewer: {
        id: 123,
        name: 'Gouda',
        __typename: 'Viewer',
        shipments: [
          {
            id: 'shipment0',
            __typename: 'Shipment',
            address: {
              street: '4th & pike',
              postal: 98102,
            },
            shipper: {
              id: 'shipper0',
              __typename: 'Shipper',
              name: 'Munster',
              email: 'munster@monsterInc.com',
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
    });
  });

});
