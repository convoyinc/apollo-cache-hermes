import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`readFragment with one fragment`, () => {

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

  it(`correctly read a fragment`, () => {
    expect(hermes.readFragment({
      id: '123',
      fragment: gql(`
        fragment viewer on Viewer {
          id
          name
        }
      `),
    })).toEqual({
      id: 123,
      name: 'Gouda',
      __typename: 'Viewer',
    });
  });

});
