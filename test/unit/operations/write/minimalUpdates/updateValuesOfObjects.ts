import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { write } from '../../../../../src/operations/write';
import { StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const basicNestedQuery = query(`{ foo { a b c } }`);

  describe(`minimal updates values of objects`, () => {

    it(`preserves objects if none of their values change`, () => {
      const { snapshot: baseSnapshot } = write(context, empty, basicNestedQuery, {
        foo: { a: 1, b: 2, c: 3 },
      });
      const { snapshot } = write(context, baseSnapshot, basicNestedQuery, {
        foo: { a: 1, b: 2, c: 3 },
      });

      expect(snapshot.getNodeData(QueryRootId)).toBe(baseSnapshot.getNodeData(QueryRootId));
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

      const baseValue = baseSnapshot.getNodeData(QueryRootId).foo;
      const newValue = snapshot.getNodeData(QueryRootId).foo;
      expect(newValue.a).toBe(baseValue.a);
      expect(newValue.c).toBe(baseValue.c);
      expect(newValue.b).toEqual({ nested: { value: 4 } });
      expect(baseValue.b).toEqual({ nested: { value: 2 } });
    });

  });

});
