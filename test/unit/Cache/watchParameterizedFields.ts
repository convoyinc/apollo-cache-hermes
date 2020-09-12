import { Cache as CacheInterface } from '@apollo/client/core';
import { Cache } from '../../../src';
import { query, strictConfig } from '../../helpers';


describe(`Cache#watch`, () => {

  const fullGraph = query(`
    query fullGraph($id: ID!) {
      foo(id: $id) {
        id
        bar(status: BARF) {
          id
          name
        }
        baz {
          id
          name
        }
      }
    }
  `);

  const simpleGraph = query(`
    query simpleGraph($id: ID!) {
      foo(id: $id) {
        id
        bar(status: BARF) {
          id
          name
        }
      }
    }
  `);

  const simpleGraphDifferentParameter = query(`
    query simpleGraph($id: ID!) {
      foo(id: $id) {
        id
        bar(status: HURK) {
          id
          name
        }
      }
    }
  `);

  const partialOverlap = query(`
    query partialOverlap($id: ID!) {
      foo(id: $id) {
        id
        baz {
          id
          name
        }
      }
    }
  `);

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
    cache.write({ ...fullGraph, variables: { id: 1 } }, baseState);
  });

  it(`triggers a callback immediately upon registration`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch({ ...simpleGraph, variables: { id: 1 } }, newResult => updates.push(newResult));

    expect(updates.length).to.eq(1);
    const [update] = updates;
    expect(update.result).to.deep.eq(baseState);
    expect(update.complete).to.eq(true);
  });

  it(`triggers a callback after writing the same query with new values`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch({ ...simpleGraph, variables: { id: 1 } }, newResult => updates.push(newResult));
    cache.write({ ...simpleGraph, variables: { id: 1 } }, { foo: { id: 1, bar: { id: 3, name: 'bar' } } });

    expect(updates.length).to.eq(2);

    const [, update] = updates;
    expect((update.result as any).foo.bar.id).to.eq(3);
    expect(update.complete).to.eq(true);
  });

  it(`doesn't trigger a callback if unrelated entities change`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch({ ...simpleGraph, variables: { id: 1 } }, newResult => updates.push(newResult));
    cache.write({ ...partialOverlap, variables: { id: 1 } }, { foo: { id: 1, baz: { id: 3, name: 'baz2' } } });

    expect(updates.length).to.eq(1);
  });

  it(`triggers an update on indirect edits to an entity`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch({ ...simpleGraph, variables: { id: 1 } }, newResult => updates.push(newResult));
    cache.write(indirectEdit, { thing: { id: 2, name: 'bar2' } });

    expect(updates.length).to.eq(2);
    const [, update] = updates;
    expect((update.result as any).foo.bar.name).to.eq('bar2');
    expect(update.complete).to.eq(true);
  });

  it(`triggers an update on reference updates from the query root`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch({ ...simpleGraph, variables: { id: 1 } }, newResult => updates.push(newResult));
    cache.write({ ...simpleGraph, variables: { id: 1 } }, { foo: { id: 100, bar: { id: 2, name: 'bar' } } });

    expect(updates.length).to.eq(2);
    const [, update] = updates;
    expect((update.result as any).foo.id).to.eq(100);
    expect(update.complete).to.eq(true);
  });

  it(`ignores updates to nodes with different parameters`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch({ ...simpleGraph, variables: { id: 1 } }, newResult => updates.push(newResult));
    cache.write({ ...simpleGraph, variables: { id: 100 } }, { foo: { id: 100, bar: { id: 2, name: 'bar' } } });

    expect(updates.length).to.eq(1);
  });

  it(`ignores updates to parameterized subfields with different parameters`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch({ ...simpleGraph, variables: { id: 1 } }, newResult => updates.push(newResult));
    cache.write(
      { ...simpleGraphDifferentParameter, variables: { id: 1 } },
      { foo: { id: 1, bar: { id: 200, name: 'hurk' } } },
    );

    expect(updates.length).to.eq(1);
  });

  it(`handles cases where we transition from complete to incomplete`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch({ ...simpleGraph, variables: { id: 1 } }, newResult => updates.push(newResult));
    cache.write({ ...partialOverlap, variables: { id: 1 } }, { foo: { id: 100, baz: { id: 3, name: 'baz' } } });

    expect(updates.length).to.eq(2);
    const [, update] = updates;
    expect((update.result as any).foo.id).to.eq(100);
    expect((update.result as any).foo.bar).to.eq(undefined);
    expect(update.complete).to.eq(false);
  });

});
