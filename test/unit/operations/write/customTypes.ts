import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { write } from '../../../../src/operations/write';
import { NodeId, StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const rootValuesQuery = query(`{ foo bar }`);

  describe(`custom types with object values`, () => {

    describe(`an empty object value`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
      beforeAll(() => {
        const result = write(context, empty, rootValuesQuery, {
          foo: {},
          bar: [],
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`stores the values`, () => {
        expect(snapshot.get(QueryRootId)).to.deep.eq({
          foo: {},
          bar: [],
        });
      });

      it(`marks the container as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
      });

    });

    describe(`custom value with id fields in it`, () => {

      let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
      beforeAll(() => {
        const result = write(context, empty, rootValuesQuery, {
          foo: { id: 1 },
          bar: {
            baz: { id: 1 },
          },
        });
        snapshot = result.snapshot;
        editedNodeIds = result.editedNodeIds;
      });

      it(`stores the values`, () => {
        expect(snapshot.get(QueryRootId)).to.deep.eq({
          foo: { id: 1 },
          bar: {
            baz: { id: 1 },
          },
        });
      });

      // TODO: We need to walk the selection set when writing, too!
      it.skip(`does not normalize the values of the custom type`, () => {
        expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
      });

      // TODO: We need to walk the selection set when writing, too!
      it.skip(`marks the container as edited`, () => {
        expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
      });

    });

  });

});
