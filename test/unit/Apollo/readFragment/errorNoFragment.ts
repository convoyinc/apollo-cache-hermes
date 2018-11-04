import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`readFragment when no fragment is provided`, () => {

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

  it(`throws an error`, () => {
    jestExpect(() => {
      hermes.readFragment({
        id: '123',
        fragment: gql(`
          query viewer {
            id
            name
          }
        `),
      });
    }).toThrow(/No operations are allowed when using a fragment as a query/i);
  });

});
