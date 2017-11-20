import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`Hermes`, () => {
  describe(`readFragment`, () => {

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
          data: { id: 123, name: 'Gouda', __typename: 'Viewer' },
        },
      });
    });

    it(`multiple fragments`, () => {
      expect(hermes.readFragment({
        id: '123',
        fragmentName: 'viewer',
        fragment: gql(`
          fragment viewer on Viewer {
            id
            name
          }

          fragment shipment on Shipment {
            id
            name
            startLoc
            stopLoc
          }
        `),
      })).to.be.deep.eq({
        id: 123,
        name: 'Gouda',
        __typename: 'Viewer',
      });
    });

  });
});
