import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { write } from '../../../../src/operations/write';
import { NodeId, Query, StaticNodeId } from '../../../../src/schema';
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

  describe(`write falsy values`, () => {
    let falsyValuesQuery: Query, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      falsyValuesQuery = query(`{ null, false, zero, string }`);

      const result = write(context, empty, rootValuesQuery, { null: null, false: false, zero: 0, string: '' });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`persists all falsy values`, () => {
      expect(snapshot.get(QueryRootId)).to.deep.eq({ null: null, false: false, zero: 0, string: '' });
    });
  });

});
