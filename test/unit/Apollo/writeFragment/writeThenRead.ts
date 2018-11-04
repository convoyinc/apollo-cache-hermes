import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`writeFragment and then readFragment`, () => {

  let hermes: Hermes;
  const readWriteFragment = gql(`
    fragment viewer on Viewer {
      id
      name
    }
    fragment shipment on Shipment {
      id
      complete
      date
    }
    fragment viewerPlusShipment on Viewer {
      ...viewer
      shipment {
        ...shipment
      }
    }
  `);

  beforeEach(() => {
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
          name: 'Gouda',
          __typename: 'Viewer',
        },
      },
      'shipment0': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: '123', path: ['shipment'] }],
        data: {
          id: 'shipment0',
          complete: false,
          city: 'Seattle',
          distance: 100,
          __typename: 'Shipment',
        },
      },
    });
  });

  it(`write then read with same fragment`, () => {
    hermes.writeFragment({
      id: '123',
      fragmentName: 'viewer',
      fragment: readWriteFragment,
      data: {
        id: 123,
        name: 'Munster',
      },
    });

    jestExpect(hermes.readFragment({
      id: '123',
      fragmentName: 'viewer',
      fragment: readWriteFragment,
    })).toEqual(jestExpect.objectContaining({
      id: 123,
      name: 'Munster',
      __typename: 'Viewer',
    }));
  });

  it(`update nested reference but read with another fragment`, () => {
    hermes.writeFragment({
      id: 'shipment0',
      fragmentName: 'shipment',
      fragment: readWriteFragment,
      data: {
        id: 'shipment0',
        complete: true,
        date: '11/11/17',
      },
    });

    jestExpect(hermes.readFragment({
      id: '123',
      fragmentName: 'viewerPlusShipment',
      fragment: readWriteFragment,
    })).toEqual({
      id: 123,
      name: 'Gouda',
      __typename: 'Viewer',
      shipment: {
        id: 'shipment0',
        complete: true,
        date: '11/11/17',
        city: 'Seattle',
        distance: 100,
        __typename: 'Shipment',
      },
    });
  });

});
