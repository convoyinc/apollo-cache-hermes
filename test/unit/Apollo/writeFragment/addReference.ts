import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { EntitySnapshot } from '../../../../src/nodes/EntitySnapshot';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`writeFragment`, () => {

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
        data: {
          id: 123,
          name: 'Gouda',
          __typename: 'Viewer',
        },
      },
    });

    hermes.writeFragment({
      id: '123',
      fragment: gql(`
        fragment viewer on Viewer {
          id
          shipment {
            id
            city
            __typename
          }
        }
      `),
      data: {
        id: 123,
        shipment: {
          id: 'shipment0',
          city: 'Seattle',
          __typename: 'Shipment',
        },
      },
    });
  });

  it(`adds references`, () => {
    expect(hermes.getCurrentCacheSnapshot().baseline.getNodeData('shipment0')).toEqual({
      id: 'shipment0',
      city: 'Seattle',
      __typename: 'Shipment',
    });
  });

  it(`inlines referenced data into referencing entities`, () => {
    const baseline = hermes.getCurrentCacheSnapshot().baseline;
    expect(baseline.getNodeSnapshot('123')).toEqual(
      new EntitySnapshot(
        {
          id: 123,
          name: 'Gouda',
          __typename: 'Viewer',
          shipment: {
            id: 'shipment0',
            city: 'Seattle',
            __typename: 'Shipment',
          },
        },
        [{ id: QueryRootId, path: ['viewer'] }],
        [{ id: 'shipment0', path: ['shipment'] }],
      )
    );

    expect(baseline.getNodeData('123')!['shipment']).toBe(baseline.getNodeData('shipment0'));
  });

});
