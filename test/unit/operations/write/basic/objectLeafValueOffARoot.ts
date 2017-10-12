import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { write } from '../../../../../src/operations/write';
import { NodeId, StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const rootValuesQuery = query(`{ foo bar }`);

  describe(`object leaf-value hanging off a root`, () => {
    let snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const result = write(context, empty, rootValuesQuery, {
        foo: {},
        bar: {
          value: 'this is a bar',
          extraProp: {
            prop1: 100,
            prop2: 200,
          },
          extraProp1: {
            prop0: 'hello',
          },
        },
      });

      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`creates the query root, with the values`, () => {
      expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
        foo: {},
        bar: {
          value: 'this is a bar',
          extraProp: {
            prop1: 100,
            prop2: 200,
          },
          extraProp1: {
            prop0: 'hello',
          },
        },
      });
    });

    it(`marks the root as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
    });

    it(`only contains the root node`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
    });

    it(`emits the root as an EntitySnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
    });
  });

  describe(`an empty object leaf-value`, () => {
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
      expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
        foo: {},
        bar: [],
      });
    });

    it(`marks the container as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
    });
  });

  describe(`non-entity object leaf-value with id fields in it`, () => {
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
      expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
        foo: { id: 1 },
        bar: {
          baz: { id: 1 },
        },
      });
    });

    it(`does not normalize the values of the object leaf-value`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
    });

    it(`marks the container as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
    });
  });

});
