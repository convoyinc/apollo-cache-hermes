import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`readFragment with alias references`, () => {

  let hermes: Hermes;
  beforeAll(() => {
    hermes = new Hermes(new CacheContext(strictConfig));
    const parameterizedId = nodeIdForParameterizedValue(
      '123',
      ['shipment'],
      { city: 'Seattle' }
    );

    hermes.restore({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        outbound: [{ id: '123', path: ['viewer'] }],
        data: {
          justValue: '42',
        },
      },
      '123': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: QueryRootId, path: ['viewer'] }],
        outbound: [{ id: parameterizedId, path: ['shipment'] }],
        data: {
          id: 123,
          name: 'Gouda',
          __typename: 'Viewer',
        },
      },
      [parameterizedId]: {
        type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
        inbound: [{ id: '123', path: ['shipment'] }],
        outbound: [{ id: 'shipment0', path: [] }],
        data: null,
      },
      'shipment0': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: [parameterizedId], path: [] }],
        data: {
          id: 'shipment0',
          __typename: 'Shipment',
          destination: 'Seattle',
          complete: false,
          truckType: 'flat-bed',
        },
      },
    });
  });

  it(`correctly read a fragment with parameterized reference`, () => {
    jestExpect(hermes.readFragment({
      id: '123',
      fragment: gql(`
        fragment viewer on Viewer {
          id
          __typename
          fullName: name
          shipmentInfo: shipment(city: $city) {
            id
            __typename
            truckType
            isCompleted: complete
            destination
          }
        }
      `),
      variables: {
        city: 'Seattle',
      },
    })).toEqual({
      id: 123,
      fullName: 'Gouda',
      name: 'Gouda',
      __typename: 'Viewer',
      shipmentInfo: {
        id: 'shipment0',
        __typename: 'Shipment',
        destination: 'Seattle',
        isCompleted: false,
        complete: false,
        truckType: 'flat-bed',
      },
    });
  });

});
