import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`readFragment with multiple fragments`, () => {

  let hermes: Hermes;
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
        data: { id: 123, name: 'Gouda', __typename: 'Viewer' },
      },
      'shipment0': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: 123, path: ['shipment'] }],
        data: {
          id: 'shipment0',
          destination: 'Seattle',
          __typename: 'Shipment',
        },
      },
    });
  });

  it(`returns a value following the named fragment ('viewer')`, () => {
    expect(hermes.readFragment({
      id: '123',
      fragmentName: 'viewer',
      fragment: gql(`
        fragment viewer on Viewer {
          id
          name
          __typename
        }

        fragment shipment on Shipment {
          id
          destination
          __typename
        }
      `),
    })).toEqual({
      id: 123,
      name: 'Gouda',
      __typename: 'Viewer',
      shipment: {
        id: 'shipment0',
        destination: 'Seattle',
        __typename: 'Shipment',
      },
    });
  });

  it(`returns a value following the named fragment ('shipment')`, () => {
    expect(hermes.readFragment({
      id: 'shipment0',
      fragmentName: 'shipment',
      fragment: gql(`
        fragment viewer on Viewer {
          id
          name
        }

        fragment shipment on Shipment {
          id
          destination
          __typename
        }
      `),
    })).toEqual({
      id: 'shipment0',
      destination: 'Seattle',
      __typename: 'Shipment',
    });
  });

});
