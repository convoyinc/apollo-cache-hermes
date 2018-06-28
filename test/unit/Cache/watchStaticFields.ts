import { query, strictConfig } from '../../helpers';
import { Cache } from '../../../src';
import { QueryResult } from '../../../src/operations/read';

describe(`Cache#watch`, () => {

  const fullGraph = query(`{
    foo {
      id
      bar {
        id
        name
      }
      baz {
        id
        name
      }
    }
  }`);

  const simpleGraph = query(`{
    foo {
      id
      bar {
        id
        name
      }
    }
  }`);

  const partialOverlap = query(`{
    foo {
      id
      baz {
        id
        name
      }
    }
  }`);

  const indirectEdit = query(`{
    thing {
      id
      name
    }
  }`);

  const baseState = {
    foo: {
      id: 1,
      bar: {
        id: 2,
        name: 'bar',
      },
      baz: {
        id: 3,
        name: 'baz',
      },
    },
  };

  let cache: Cache;
  beforeEach(() => {
    cache = new Cache(strictConfig);
    cache.write(fullGraph, baseState);
  });

  it(`triggers a callback immediately upon registration`, () => {
    const updates: QueryResult[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));

    expect(updates.length).to.eq(1);
    const [update] = updates;
    expect(update.result).to.deep.eq(baseState);
    expect(update.complete).to.eq(true);
  });

  it(`triggers a callback after writing the same query with new values`, () => {
    const updates: QueryResult[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));
    cache.write(simpleGraph, { foo: { id: 1, bar: { id: 3, name: 'bar' } } });

    expect(updates.length).to.eq(2);

    const [, update] = updates;
    expect((update.result as any).foo.bar.id).to.eq(3);
    expect(update.complete).to.eq(true);
  });

  it(`doesn't trigger a callback if unrelated entities change`, () => {
    const updates: QueryResult[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));
    cache.write(partialOverlap, { foo: { id: 1, baz: { id: 3, name: 'baz2' } } });

    expect(updates.length).to.eq(1);
  });

  it(`triggers an update on indirect edits to an entity`, () => {
    const updates: QueryResult[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));
    cache.write(indirectEdit, { thing: { id: 2, name: 'bar2' } });

    expect(updates.length).to.eq(2);
    const [, update] = updates;
    expect((update.result as any).foo.bar.name).to.eq('bar2');
    expect(update.complete).to.eq(true);
  });

  it(`triggers an update on reference updates from the query root`, () => {
    const updates: QueryResult[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));
    cache.write(simpleGraph, { foo: { id: 100, bar: { id: 2, name: 'bar' } } });

    expect(updates.length).to.eq(2);
    const [, update] = updates!;
    expect((update.result as any).foo.id).to.eq(100);
    expect(update.complete).to.eq(true);
  });

  it(`handles cases where we transition from complete to incomplete`, () => {
    const updates: QueryResult[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));
    cache.write(partialOverlap, { foo: { id: 100, baz: { id: 3, name: 'baz' } } });

    expect(updates.length).to.eq(2);
    const [, update] = updates!;
    expect((update.result as any).foo.id).to.eq(100);
    expect((update.result as any).foo.bar).to.eq(undefined);
    expect(update.complete).to.eq(false);
  });

});
