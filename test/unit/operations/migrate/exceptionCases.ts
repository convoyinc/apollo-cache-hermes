import { CacheSnapshot } from '../../../../src/CacheSnapshot';
import { CacheContext } from '../../../../src/context/CacheContext';
import { extract, migrate } from '../../../../src/operations';
import { OptimisticUpdateQueue } from '../../../../src/OptimisticUpdateQueue';
import { JsonValue } from '../../../../src/primitive';
import { createGraphSnapshot, strictConfig } from '../../../helpers';

describe(`operations.migrate`, () => {
  let cacheContext: CacheContext;
  let cacheSnapshot: CacheSnapshot;
  beforeAll(() => {
    cacheContext = new CacheContext({ ...strictConfig, freeze: false });
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
    cacheSnapshot = new CacheSnapshot(snapshot, snapshot, new OptimisticUpdateQueue());
  });

  it(`does nothing if no migration map is provided`, () => {
    const migrated = migrate(cacheSnapshot);
    const cacheAfter = extract(migrated.baseline, cacheContext);
    expect(cacheAfter).to.be.deep.eq(extract(cacheSnapshot.baseline, cacheContext));
  });

  it(`throws if trying to migrate a reference field`, () => {
    expect(() => {
      migrate(cacheSnapshot, {
        _entities: {
          ['Query']: {
            viewer: (_previous: JsonValue) => '',
          },
        },
      });
    }).to.throw(/Migration is not allowed/i);
  });
});
