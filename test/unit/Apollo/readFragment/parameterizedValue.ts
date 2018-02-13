import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`readFragment with parameterized values`, () => {

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
        data: {
          __typename: 'Shipment',
          destination: 'Seattle',
          complete: false,
          truckType: 'flat-bed',
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
          shipment(city: $city) {
            __typename
            truckType
            complete
            destination
          }
        }
      `),
      variables: {
        city: 'Seattle',
      },
    })).to.be.deep.eq({
      id: 123,
      name: 'Gouda',
      __typename: 'Viewer',
      shipment: {
        __typename: 'Shipment',
        destination: 'Seattle',
        complete: false,
        truckType: 'flat-bed',
      },
    });
  });

});
