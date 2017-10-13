import { createSnapshot } from '../../../../helpers';

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {
  describe(`invalid nested values, scalar in place of object value`, () => {

    it(`creates the query root, with the values`, () => {
      expect(() => {
        createSnapshot(
          {
            foo: {
              bar: 'THIS IS A STRING NOT OBJECT',
            },
          },
          `{
            foo {
              bar {
                value
                prop1
                prop2
              }
            }
          }`
        );
      }).to.throw(/foo\.bar/);
    });

  });
});
