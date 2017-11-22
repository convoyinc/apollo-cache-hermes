import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`Hermes`, () => {
  describe(`readFragment`, () => {

    let hermes: Hermes;
    beforeAll(() => {
      hermes = new Hermes(new CacheContext(strictConfig));
      const parameterizedId0 = nodeIdForParameterizedValue(
        QueryRootId,
        ['viewer', 0],
        { number: 1, destination: 'Seattle' }
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
          outbound: [
            { id: parameterizedId0, path: ['shipements', 0] },
          ],
          data: { id: 123, name: 'Gouda', __typename: 'Viewer' },
        },
        [parameterizedId0]: {
          type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: '123', path: ['viewer', 0] }],
          outbound: [{ id: 'shipment1', path: [] }],
          data: null,
        },
        'shipment1': {
          type: Serializable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId0, path: [] }],
          data: {
            id: 'shipment1',
            truckType: 'flatbed',
            __typename: 'Shipment',
          },
        },
      });
    });

    it(`parameterized field in a fragment`, () => {
      expect(hermes.readFragment({
        id: '123',
        fragment: gql(`
          fragment viewer on Viewer {
            id
            name
            shipments(number: 1, destination: $city) {
              id
              truckType
            }
          }
        `),
      })).to.be.deep.eq({
        id: 123,
        name: 'Gouda',
        __typename: 'Viewer',
        shipements: [
          {
            id: 'shipment1',
            truckType: 'flatbed',
            __typename: 'Shipment',
          },
        ],
      });
    });

  });
});
