import * as _ from 'lodash';

import { CacheSnapshot } from '../../../../src/CacheSnapshot';
import { CacheContext } from '../../../../src/context/CacheContext';
import { migrate, read, MigrationMap, QueryResult } from '../../../../src/operations';
import { OptimisticUpdateQueue } from '../../../../src/OptimisticUpdateQueue';
import { createGraphSnapshot, strictConfig, query } from '../../../helpers';

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

// same as cache snapshot created by `createNewCacheShapshot1` plus the
// `user(id: $id)` parameterized field
function createNewCacheSnapshot2(cacheContext: CacheContext) {
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
      user: {
        id: 'xxx',
        first: 'YoYo',
        last: 'Ma',
        __typename: 'User',
      },
    },
    `query dummy($id: ID) { 
      foo
      bar
      viewer { id first last __typename }
      user(id: $id) { id first last __typename }
    }`,
    cacheContext,
    { id: 'xxx' }
  );
  return new CacheSnapshot(snapshot, snapshot, new OptimisticUpdateQueue());
}

// same as cache snapshot created by `createNewCacheShapshot` plus the
// `friends(circle: $circle)` parameterized field
function createNewCacheSnapshot3(cacheContext: CacheContext) {
  const snapshot = createGraphSnapshot(
    {
      foo: 123,
      bar: 'asdf',
      viewer: {
        id: 'a',
        first: 'Jonh',
        last: 'Doe',
        __typename: 'Viewer',
        friends: [{
          id: 'friend-1',
          first: 'Bob',
          last: 'Breaker',
          __typename: 'Friend',
        }, {
          id: 'friend-2',
          first: 'Susan',
          last: 'Fixer',
          __typename: 'Friend',
        }],
      },
    },
    `query dummy($circle: String) { 
      foo
      bar
      viewer {
        id
        first
        last
        __typename
        friends(circle: $circle) { id first last }
      }
    }`,
    cacheContext,
    { circle: 'elementary' }
  );
  return new CacheSnapshot(snapshot, snapshot, new OptimisticUpdateQueue());
}

describe(`operations.migrate`, () => {
  let cacheContext: CacheContext;

  beforeAll(() => {
    cacheContext = new CacheContext({ ...strictConfig, freeze: false });
  });

  it(`can add parameterized fields to root`, () => {
    const migrationMap: MigrationMap = {
      _parameterized: {
        Query: [{
          path: ['user'],
          args: { id: 'xxx' },
          defaultReturn: null,
        }],
      },
    };
    const migrated = migrate(createNewCacheSnapshot(cacheContext), migrationMap);
    const { result, complete } = read(cacheContext, query(`
      query dummy($id: ID) {
        foo
        bar
        user(id: $id)
      }
    `, { id: 'xxx' }), migrated.baseline);

    jestExpect(complete).toBeTruthy();
    jestExpect(_.get(result, 'user')).toBeNull();
  });

  it(`doesn't wipe out compatable parameterized fields at root`, () => {
    const migrationMap: MigrationMap = {
      _parameterized: {
        Query: [{
          path: ['user'],
          args: { id: 'xxx' },
          defaultReturn: null,
        }],
      },
    };
    // start with a snapshot with user(id: $id) already in place at root
    const snapshot = createNewCacheSnapshot2(cacheContext);
    const migrated = migrate(snapshot, migrationMap);

    // migration should yield no change to the user(id: $id) parameterized field
    const { result, complete } = read(cacheContext, query(`
      query dummy($id: ID) {
        foo
        bar
        user(id: $id) {
          id
          first
          last
        }
      }
    `, { id: 'xxx' }), migrated.baseline);

    jestExpect(complete).toBeTruthy();
    jestExpect(_.get(result, 'user')).toEqual({
      id: 'xxx',
      first: 'YoYo',
      last: 'Ma',
      __typename: 'User',
    });
  });

  it(`can modify the signature of existing parameterized fields at root`, () => {
    const migrationMap: MigrationMap = {
      _parameterized: {
        ['Query']: [{
          path: ['user'],
          args: { id: 'xxx', extraInfo: true },
          defaultReturn: null,
        }],
      },
    };
    // start with a snapshot with user(id: $id) already in place at root
    const snapshot = createNewCacheSnapshot2(cacheContext);
    const migrated = migrate(snapshot, migrationMap);

    // read for the old parameterized field should no longer succeed
    const { result, complete } = read(cacheContext, query(`
      query dummy($id: ID) {
        foo
        bar
        user(id: $id, extraInfo: true)
      }
    `, { id: 'xxx' }), migrated.baseline);

    jestExpect(complete).toBeTruthy();
    jestExpect(_.get(result, 'user')).toBe(null);
  });

  it(`can add parameterized fields to entity`, () => {
    const migrationMap: MigrationMap = {
      _parameterized: {
        ['Viewer']: [{
          path: ['friends'],
          args: { circle: 'elementary' },
          defaultReturn: [],
        }],
      },
    };
    const migrated = migrate(createNewCacheSnapshot(cacheContext), migrationMap);
    const { result, complete } = read(cacheContext, query(`
      query dummy($circle: String) {
        foo
        bar
        viewer {
          id
          friends(circle: $circle) {
            id
            first
            last
          }
        }
      }
    `, { circle: 'elementary' }), migrated.baseline);

    jestExpect(complete).toBeTruthy();
    jestExpect(_.get(result, ['viewer', 'friends'])).toEqual([]);
  });

  it(`doesn't wipe out compatable parameterized fields on entity`, () => {
    const migrationMap: MigrationMap = {
      _parameterized: {
        Viewer: [{
          path: ['friends'],
          args: { circle: 'elementary' },
          defaultReturn: [],
        }],
      },
    };
    // start with a snapshot with user(id: $id) already in place at root
    const snapshot = createNewCacheSnapshot3(cacheContext);
    const migrated = migrate(snapshot, migrationMap);

    // migration should yield no change to the user(id: $id) parameterized field
    const { result, complete } = read(cacheContext, query(`
      query dummy($circle: String) {
        foo
        bar
        viewer {
          id
          friends(circle: $circle) {
            id
            first
            last
          }
        }
      }
    `, { circle: 'elementary' }), migrated.baseline);

    jestExpect(complete).toBeTruthy();
    jestExpect(_.get(result, ['viewer', 'friends'])).toEqual([{
      '__typename': 'Friend',
      id: 'friend-1',
      first: 'Bob',
      last: 'Breaker',
    }, {
      '__typename': 'Friend',
      id: 'friend-2',
      first: 'Susan',
      last: 'Fixer',
    }]);
  });

  it(`can modify parameterized fields of entity`, () => {
    const migrationMap: MigrationMap = {
      _parameterized: {
        Viewer: [{
          path: ['friends'],
          args: { circle: 'elementary', stillFriends: true },
          defaultReturn: [],
        }],
      },
    };
    const migrated = migrate(createNewCacheSnapshot3(cacheContext), migrationMap);
    const { result, complete } = read(cacheContext, query(`
      query dummy($circle: String, $stillFriends: Boolean) {
        foo
        bar
        viewer {
          id
          friends(circle: $circle, stillFriends: $stillFriends) {
            id
            first
            last
          }
        }
      }
    `, { circle: 'elementary', stillFriends: true }), migrated.baseline);

    jestExpect(complete).toBeTruthy();
    jestExpect(_.get(result, ['viewer', 'friends'])).toEqual([]);
  });

  it(`can copy from path`, () => {
    const copyFrom = { path: ['friends'], args: { circle: 'elementary' } };
    const { result, complete } = copyFromPath(cacheContext, copyFrom);

    jestExpect(complete).toBeTruthy();
    jestExpect(_.get(result, ['viewer', 'friends'])).toEqual([{
      '__typename': 'Friend',
      id: 'friend-1',
      first: 'Bob',
      last: 'Breaker',
    }, {
      '__typename': 'Friend',
      id: 'friend-2',
      first: 'Susan',
      last: 'Fixer',
    }]);
  });

  it(`defaults to defaultReturn if can't copy from path`, () => {
    const copyFrom = { path: ['friends'], args: { circle: 'foo' } };
    const { result, complete } = copyFromPath(cacheContext, copyFrom);

    jestExpect(complete).toBeTruthy();
    jestExpect(_.get(result, ['viewer', 'friends'])).toEqual([]);
  });

  it(`defaults to defaultReturn if copyFrom is undefined`, () => {
    const copyFrom = undefined;
    const { result, complete } = copyFromPath(cacheContext, copyFrom);

    jestExpect(complete).toBeTruthy();
    jestExpect(_.get(result, ['viewer', 'friends'])).toEqual([]);
  });

  it(`defaults to defaultReturn if copyFrom.args is undefined`, () => {
    const copyFrom = { path: ['friends'] };
    const { result, complete } = copyFromPath(cacheContext, copyFrom);

    jestExpect(complete).toBeTruthy();
    jestExpect(_.get(result, ['viewer', 'friends'])).toEqual([]);
  });

  it(`can complete when parameterized entity is undefined`, () => {
    const migrationMap: MigrationMap = {
      _parameterized: {
        Viewer: [{
          path: ['friends'],
          args: { circle: 'elementary' },
          defaultReturn: null,
          copyFrom: { path: ['friends'], args: { circle: 'elementary', stillFriends: true } },
        }],
      },
    };

    const snapshot = createNewCacheSnapshot2(cacheContext);
    const migrated = migrate(snapshot, migrationMap);
    const { complete, result } = read(
      cacheContext,
      query(parameterizedQuery, { circle: 'elementary', stillFriends: true }),
      migrated.baseline
    );

    jestExpect(complete).toBeTruthy();
    jestExpect(_.get(result, ['viewer', 'friends'])).toEqual(null);
  });
});

const parameterizedQuery = `
query dummy($circle: String, $stillFriends: Boolean) {
  foo
  bar
  viewer {
    id
    friends(circle: $circle, stillFriends: $stillFriends) {
      id
      first
      last
    }
  }
}
`;

function copyFromPath(cacheContext: CacheContext, copyFrom?: any): QueryResult {
  const migrationMap: MigrationMap = {
    _parameterized: {
      Viewer: [{
        path: ['friends'],
        args: { circle: 'elementary', stillFriends: true },
        defaultReturn: [],
        copyFrom,
      }],
    },
  };

  const snapshot = createNewCacheSnapshot3(cacheContext);
  const migrated = migrate(snapshot, migrationMap);
  return read(
    cacheContext,
    query(parameterizedQuery, { circle: 'elementary', stillFriends: true }),
    migrated.baseline,
  );
}
