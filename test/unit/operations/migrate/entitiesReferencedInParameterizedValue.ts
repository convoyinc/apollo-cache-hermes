import { CacheSnapshot } from '../../../../src/CacheSnapshot';
import { CacheContext } from '../../../../src/context/CacheContext';
import { extract, migrate } from '../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { OptimisticUpdateQueue } from '../../../../src/OptimisticUpdateQueue';
import { JsonValue } from '../../../../src/primitive';
import { Serializable, StaticNodeId } from '../../../../src/schema';
import { createGraphSnapshot, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

function createNewCacheSnapshot(cacheContext: CacheContext) {
  const snapshot = createGraphSnapshot(
    {
      one: {
        two: [
          {
            three: {
              id: 31,
              four: { five: 1 },
              color: 'blue',
              __typename: 'THREE',
            },
          },
          {
            three: {
              id: 32,
              four: { five: 1 },
              color: 'gold',
              __typename: 'THREE',
            },
          },
          null,
        ],
      },
    },
    `query nested($id: ID!) {
      one {
        two(id: $id) {
          three {
            id
            four(extra: true) {
              five
            }
            color
            __typename
          }
        }
      }
    }`,
    cacheContext,
    { id: 1 }
  );
  return new CacheSnapshot(snapshot, snapshot, new OptimisticUpdateQueue());
}

describe(`operations.migrate`, () => {
  let cacheContext: CacheContext;
  beforeAll(() => {
    cacheContext = new CacheContext({ ...strictConfig, freeze: false });
  });

  it(`can add fields to entities referenced within parameterized value`, () => {
    const migrated = migrate(createNewCacheSnapshot(cacheContext), {
      _entities: {
        THREE: {
          size: (_previous: JsonValue) => 1024,
        },
      },
    });
    const cacheAfter = extract(migrated.baseline, cacheContext);

    const parameterizedTopContainerId = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two'],
      { id: 1 }
    );

    const nestedParameterizedValueId0 = nodeIdForParameterizedValue(
      '31',
      ['four'],
      { extra: true },
    );

    const nestedParameterizedValueId1 = nodeIdForParameterizedValue(
      '32',
      ['four'],
      { extra: true },
    );

    expect(cacheAfter).to.deep.eq({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        outbound: [{ id: parameterizedTopContainerId, path: ['one', 'two'] }],
      },
      [parameterizedTopContainerId]: {
        type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
        inbound: [{ id: QueryRootId, path: ['one', 'two'] }],
        outbound: [
          { id: '31', path: [0, 'three'] },
          { id: '32', path: [1, 'three'] },
        ],
        data: [{ three: undefined }, { three: undefined }, null],
      },
      '31': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: parameterizedTopContainerId, path: [0, 'three'] }],
        outbound: [{ id: nestedParameterizedValueId0, path: ['four'] }],
        data: {
          id: 31,
          color: 'blue',
          size: 1024,
          __typename: 'THREE',
        },
      },
      [nestedParameterizedValueId0]: {
        type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
        inbound: [{ id: '31', path: ['four'] }],
        data: {
          five: 1,
        },
      },
      '32': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: parameterizedTopContainerId, path: [1, 'three'] }],
        outbound: [{ id: nestedParameterizedValueId1, path: ['four'] }],
        data: {
          id: 32,
          color: 'gold',
          size: 1024,
          __typename: 'THREE',
        },
      },
      [nestedParameterizedValueId1]: {
        type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
        inbound: [{ id: '32', path: ['four'] }],
        data: {
          five: 1,
        },
      },
    });
  });

  it(`can modify fields to entities referenced within parameterized value`, () => {
    const migrated = migrate(createNewCacheSnapshot(cacheContext), {
      _entities: {
        THREE: {
          color: (previous: JsonValue) => `really ${previous}`,
        },
      },
    });
    const cacheAfter = extract(migrated.baseline, cacheContext);

    const parameterizedTopContainerId = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two'],
      { id: 1 }
    );

    const nestedParameterizedValueId0 = nodeIdForParameterizedValue(
      '31',
      ['four'],
      { extra: true },
    );

    const nestedParameterizedValueId1 = nodeIdForParameterizedValue(
      '32',
      ['four'],
      { extra: true },
    );

    expect(cacheAfter).to.deep.eq({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        outbound: [{ id: parameterizedTopContainerId, path: ['one', 'two'] }],
      },
      [parameterizedTopContainerId]: {
        type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
        inbound: [{ id: QueryRootId, path: ['one', 'two'] }],
        outbound: [
          { id: '31', path: [0, 'three'] },
          { id: '32', path: [1, 'three'] },
        ],
        data: [{ three: undefined }, { three: undefined }, null],
      },
      '31': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: parameterizedTopContainerId, path: [0, 'three'] }],
        outbound: [{ id: nestedParameterizedValueId0, path: ['four'] }],
        data: {
          id: 31,
          color: 'really blue',
          __typename: 'THREE',
        },
      },
      [nestedParameterizedValueId0]: {
        type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
        inbound: [{ id: '31', path: ['four'] }],
        data: {
          five: 1,
        },
      },
      '32': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        inbound: [{ id: parameterizedTopContainerId, path: [1, 'three'] }],
        outbound: [{ id: nestedParameterizedValueId1, path: ['four'] }],
        data: {
          id: 32,
          color: 'really gold',
          __typename: 'THREE',
        },
      },
      [nestedParameterizedValueId1]: {
        type: Serializable.NodeSnapshotType.ParameterizedValueSnapshot,
        inbound: [{ id: '32', path: ['four'] }],
        data: {
          five: 1,
        },
      },
    });
  });

});
