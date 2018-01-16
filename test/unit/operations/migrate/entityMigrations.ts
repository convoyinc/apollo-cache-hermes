import { CacheSnapshot } from '../../../../src/CacheSnapshot';
import { CacheContext } from '../../../../src/context/CacheContext';
import { extract, migrate } from '../../../../src/operations';
import { OptimisticUpdateQueue } from '../../../../src/OptimisticUpdateQueue';
import { JsonValue } from '../../../../src/primitive';
import { Serializable, StaticNodeId } from '../../../../src/schema';
import { createGraphSnapshot, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

function createNewCacheSnapshot(cacheContext: CacheContext) {
  const snapshot = createGraphSnapshot(
    {
      foo: 123,
      bar: 'asdf',
      viewer: {
        id: 'a',
        first: 'Jonh',
        last: 'Doe',
        __typename: 'Viewer',
      },
    },
    `{ foo bar viewer { id first last __typename } }`,
    cacheContext
  );
  return new CacheSnapshot(snapshot, snapshot, new OptimisticUpdateQueue());
}

describe(`operations.migrate`, () => {
  let cacheContext: CacheContext;
  // let cacheSnapshot: CacheSnapshot;
  beforeAll(() => {
    cacheContext = new CacheContext({ ...strictConfig, freeze: false });
  });

  it(`can add fields to root`, () => {
    const migrated = migrate(createNewCacheSnapshot(cacheContext), { ['Query']: {
      extra: (_previous: JsonValue) => '',
    } });
    const cacheAfter = extract(migrated.baseline, cacheContext);
    expect(cacheAfter).to.deep.eq({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        data: {
          foo: 123,
          bar: 'asdf',
          extra: '',
          'viewer': undefined,
        },
        outbound: [{
          id: 'a', path: ['viewer'],
        }],
      },
      'a': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        data: {
          id: 'a',
          first: 'Jonh',
          last: 'Doe',
          __typename: 'Viewer',
        },
        inbound: [{ id: QueryRootId, path: ['viewer'] }],
      },
    });
  });

  it(`can modify fields to root`, () => {
    const migrated = migrate(createNewCacheSnapshot(cacheContext), { ['Query']: {
      foo: (_previous: JsonValue) => 456,
      bar: (_previous: JsonValue) => 'woohoo',
    } });
    const cacheAfter = extract(migrated.baseline, cacheContext);
    expect(cacheAfter).to.deep.eq({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        data: {
          foo: 456,
          bar: 'woohoo',
          'viewer': undefined,
        },
        outbound: [{
          id: 'a', path: ['viewer'],
        }],
      },
      'a': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        data: {
          id: 'a',
          first: 'Jonh',
          last: 'Doe',
          __typename: 'Viewer',
        },
        inbound: [{ id: QueryRootId, path: ['viewer'] }],
      },
    });
  });

  it(`can add fields to non-root entites`, () => {
    const migrated = migrate(createNewCacheSnapshot(cacheContext), { ['Viewer']: {
      suffix: (_previous: JsonValue) => 'Dr',
    } });
    const cacheAfter = extract(migrated.baseline, cacheContext);
    expect(cacheAfter).to.deep.eq({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        data: {
          foo: 123,
          bar: 'asdf',
          'viewer': undefined,
        },
        outbound: [{
          id: 'a', path: ['viewer'],
        }],
      },
      'a': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        data: {
          id: 'a',
          first: 'Jonh',
          last: 'Doe',
          suffix: 'Dr',
          __typename: 'Viewer',
        },
        inbound: [{ id: QueryRootId, path: ['viewer'] }],
      },
    });
  });

  it(`can modify fields of non-root entities`, () => {
    const migrated = migrate(createNewCacheSnapshot(cacheContext), { ['Viewer']: {
      first: (_previous: JsonValue) => 'Adam',
      last: (_previous: JsonValue) => 'Smith',
    } });
    const cacheAfter = extract(migrated.baseline, cacheContext);
    expect(cacheAfter).to.deep.eq({
      [QueryRootId]: {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        data: {
          foo: 123,
          bar: 'asdf',
          'viewer': undefined,
        },
        outbound: [{
          id: 'a', path: ['viewer'],
        }],
      },
      'a': {
        type: Serializable.NodeSnapshotType.EntitySnapshot,
        data: {
          id: 'a',
          first: 'Adam',
          last: 'Smith',
          __typename: 'Viewer',
        },
        inbound: [{ id: QueryRootId, path: ['viewer'] }],
      },
    });
  });

});
