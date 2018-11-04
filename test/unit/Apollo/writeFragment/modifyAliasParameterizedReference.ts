import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`writeFragment with alias paramterized references`, () => {

  const parameterizedId = nodeIdForParameterizedValue(
    '123',
    ['shipment'],
    { city: 'Seattle' }
  );

  let hermes: Hermes, baseline: GraphSnapshot;
  beforeAll(() => {
    hermes = new Hermes(new CacheContext(strictConfig));
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
          destination: 'Seattle',
          complete: false,
          truckType: 'flat-bed',
        },
      },
    });

    hermes.writeFragment({
      id: '123',
      fragment: gql(`
        fragment viewer on Viewer {
          id
          shipmentInfo: shipment(city: $city) {
            id
            complete
            truck: truckType
          }
        }
      `),
      variables: {
        city: 'Seattle',
      },
      data: {
        id: 123,
        shipmentInfo: {
          id: 'shipment0',
          complete: true,
          truck: 'flatbed',
        },
      },
    });
    baseline = hermes.getCurrentCacheSnapshot().baseline;
  });

  it(`correctly modify data`, () => {
    jestExpect(baseline.getNodeData('shipment0')).toEqual({
      complete: true,
      truckType: 'flatbed',
      id: 'shipment0',
      destination: 'Seattle',
    });
  });

  it(`correctly references a parameterized reference`, () => {
    jestExpect(baseline.getNodeSnapshot(parameterizedId)).toEqual({
      outbound: [{ id: 'shipment0', path: [] }],
      inbound: [{ id: '123', path: ['shipment'] }],
      data: {
        complete: true,
        truckType: 'flatbed',
        id: 'shipment0',
        destination: 'Seattle',
      },
    });
    jestExpect(baseline.getNodeData(parameterizedId)).toBe(baseline.getNodeData('shipment0'));
  });

});
