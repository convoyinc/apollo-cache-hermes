import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { write } from '../../../../src/operations/write';
import { StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const basicQuery = query(`{ foo }`);
  const basicNestedQuery = query(`{ foo { a b c } }`);

  describe(`minimal edits of arrays`, () => {

    it(`preserves scalar arrays if none of their values change`, () => {
      const { snapshot: baseSnapshot } = write(context, empty, basicQuery, { foo: [1, 2, 3] });
      const { snapshot } = write(context, baseSnapshot, basicQuery, { foo: [1, 2, 3] });

      expect(snapshot.get(QueryRootId)).to.eq(baseSnapshot.get(QueryRootId));
    });

    it(`preserves complex arrays if none of their values change`, () => {
      const value1 = { nested: { value: 1 } };
      const value2 = { nested: { value: 2 } };
      const value3 = { nested: { value: 3 } };
      const { snapshot: baseSnapshot } = write(context, empty, basicQuery, {
        foo: [value1, value2, value3],
      });
      const { snapshot } = write(context, baseSnapshot, basicQuery, {
        foo: [value1, value2, value3],
      });

      expect(snapshot.get(QueryRootId)).to.eq(baseSnapshot.get(QueryRootId));
    });

    it(`only edits values that do change`, () => {
      const value1 = { nested: { value: 1 } };
      const value2 = { nested: { value: 2 } };
      const value3 = { nested: { value: 3 } };
      const value4 = { nested: { value: 4 } };
      const { snapshot: baseSnapshot } = write(context, empty, basicQuery, {
        foo: [value1, value2, value3],
      });
      const { snapshot } = write(context, baseSnapshot, basicQuery, {
        foo: [value1, value4, value3],
      });

      const baseValue = baseSnapshot.get(QueryRootId).foo;
      const newValue = snapshot.get(QueryRootId).foo;
      expect(newValue[0]).to.eq(baseValue[0]);
      expect(newValue[2]).to.eq(baseValue[2]);
      expect(newValue[1]).to.deep.eq({ nested: { value: 4 } });
      expect(baseValue[1]).to.deep.eq({ nested: { value: 2 } });
    });

  });

  describe(`minimal edits of objects`, () => {

    it(`preserves objects if none of their values change`, () => {
      const { snapshot: baseSnapshot } = write(context, empty, basicNestedQuery, {
        foo: { a: 1, b: 2, c: 3 },
      });
      const { snapshot } = write(context, baseSnapshot, basicNestedQuery, {
        foo: { a: 1, b: 2, c: 3 },
      });

      expect(snapshot.get(QueryRootId)).to.eq(baseSnapshot.get(QueryRootId));
    });

    it(`only edits values that do change`, () => {
      const value1 = { nested: { value: 1 } };
      const value2 = { nested: { value: 2 } };
      const value3 = { nested: { value: 3 } };
      const value4 = { nested: { value: 4 } };
      const { snapshot: baseSnapshot } = write(context, empty, basicNestedQuery, {
        foo: { a: value1, b: value2, c: value3 },
      });
      const { snapshot } = write(context, baseSnapshot, basicNestedQuery, {
        foo: { a: value1, b: value4, c: value3 },
      });

      const baseValue = baseSnapshot.get(QueryRootId).foo;
      const newValue = snapshot.get(QueryRootId).foo;
      expect(newValue.a).to.eq(baseValue.a);
      expect(newValue.c).to.eq(baseValue.c);
      expect(newValue.b).to.deep.eq({ nested: { value: 4 } });
      expect(baseValue.b).to.deep.eq({ nested: { value: 2 } });
    });

  });

});
