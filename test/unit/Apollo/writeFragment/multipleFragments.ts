import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`writeFragment with multiple fragments`, () => {

  let hermes: Hermes;
  const fragments = gql(`
    fragment viewer on Viewer {
      id
      nameViewer
    }

    fragment shipment on Shipment {
      id
      name
      begin
      end
    }
  `);

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
        outbound: [{ id: 'shipment0', path: ['shipment'] }],
        data: {
          id: 123,
          nameViewer: 'Gouda',
          __typename: 'Viewer',
        },
      },
      'shipment0': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: '123', path: ['shipment'] }],
        data: {
          id: 'shipment0',
          __typename: 'Shipment',
        },
      },
    });
  });

  it(`correctly write a 'viewer' fragment`, () => {
    hermes.writeFragment({
      id: '123',
      fragmentName: 'viewer',
      fragment: fragments,
      data: {
        id: 123,
        nameViewer: 'Munster',
      },
    });

    expect(hermes.getCurrentCacheSnapshot().baseline.getNodeData('123')).toEqual({
      id: 123,
      nameViewer: 'Munster',
      __typename: 'Viewer',
      shipment: {
        id: 'shipment0',
        __typename: 'Shipment',
      },
    });
  });

  it(`correctly write a 'shipment' fragment`, () => {
    hermes.writeFragment({
      id: 'shipment0',
      fragmentName: 'shipment',
      fragment: fragments,
      data: {
        id: 'shipment0',
        name: 'Shipping some Cheese',
        begin: 'Seattle',
        end: 'West Seattle',
      },
    });

    expect(hermes.getCurrentCacheSnapshot().baseline.getNodeData('shipment0')).toEqual({
      id: 'shipment0',
      name: 'Shipping some Cheese',
      begin: 'Seattle',
      end: 'West Seattle',
      __typename: 'Shipment',
    });
  });

  it(`correctly modify 'viewer' reference`, () => {
    expect(hermes.getCurrentCacheSnapshot().baseline.getNodeData('123')).toEqual({
      id: 123,
      nameViewer: 'Munster',
      __typename: 'Viewer',
      shipment: {
        id: 'shipment0',
        name: 'Shipping some Cheese',
        begin: 'Seattle',
        end: 'West Seattle',
        __typename: 'Shipment',
      },
    });
  });

});
