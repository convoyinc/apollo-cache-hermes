import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { write } from '../../../../../src/operations/write';
import { query, strictConfig } from '../../../../helpers';

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const rootValuesQuery = query(`{
    foo {
      bar {
        value
        prop1
        prop2
      }
    }
  }`);

  describe(`invalid nested values, expect an object`, () => {
    it(`creates the query root, with the values`, () => {
      expect(() => {
        write(context, empty, rootValuesQuery, {
          foo: {
            bar: 'THIS IS A STRING NOT OBJECT',
          },
        });
      }).to.throw(/foo\.bar/);
    });
  });

});
