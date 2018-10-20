import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../src/nodes/EntitySnapshot';
import { StaticNodeId, Serializable } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`writeFragment with simple reference`, () => {

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
        data: { id: 123, name: 'Gouda', __typename: 'Viewer' },
      },
    });

    hermes.writeFragment({
      id: '123',
      fragment: gql(`
        fragment viewer on Viewer {
          id
          name
          notes {
            details
          }
        }
      `),
      data: {
        id: 123,
        name: 'Munster',
        __typename: 'Viewer',
        notes: [
          {
            details: 'Hello',
          },
          {
            details: 'World',
          },
        ],
      },
    });
    baseline = hermes.getCurrentCacheSnapshot().baseline;
  });

  it(`correctly modify data on the reference`, () => {
    expect(baseline.getNodeData('123')).toEqual({
      id: 123,
      name: 'Munster',
      __typename: 'Viewer',
      notes: [
        {
          details: 'Hello',
        },
        {
          details: 'World',
        },
      ],
    });
  });

  it(`correctly reference from root node`, () => {
    expect(baseline.getNodeSnapshot('123')).toEqual(
      new EntitySnapshot(
        {
          id: 123,
          name: 'Munster',
          __typename: 'Viewer',
          notes: [
            {
              details: 'Hello',
            },
            {
              details: 'World',
            },
          ],
        },
        [{ id: QueryRootId, path: ['viewer'] }],
      )
    );
    expect(baseline.getNodeData(QueryRootId)!['viewer']).toBe(baseline.getNodeData('123'));
  });

});
