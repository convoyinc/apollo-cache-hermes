import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../src/nodes/EntitySnapshot';
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
  const rootValuesQuery = query(`{
    foo {
      id
      name
    }
    bar {
      id
      name
      extra
    }
  }`);
  const rootMergeQuery = query(`{
    foo {
      id
      name
    }
    bar {
      id
      extra
    }
  }`);

  describe(`merge unidentifiable payloads with previously known nodes`, () => {
    let baseline: GraphSnapshot, snapshot: GraphSnapshot, editedNodeIds: Set<NodeId>;
    beforeAll(() => {
      const baselineResult = write(context, empty, rootValuesQuery, {
        foo: { id: 1, name: 'Foo' },
        bar: { id: 2, name: 'Bar', extra: null },
      });
      baseline = baselineResult.snapshot;

      const result = write(context, baseline, rootMergeQuery, {
        foo: { id: 1, name: 'Foo Boo' },
        bar: { id: 2, extra: true },
      });
      snapshot = result.snapshot;
      editedNodeIds = result.editedNodeIds;
    });

    it(`updates existing values in referenced nodes`, () => {
      expect(snapshot.get('1')).to.deep.eq({ id: 1, name: 'Foo Boo' });
    });

    it(`inserts new values in referenced nodes`, () => {
      expect(snapshot.get('2')).to.deep.eq({ id: 2, name: 'Bar', extra: true });
    });

    it(`updates references to the newly edited nodes`, () => {
      const root = snapshot.get(QueryRootId);
      expect(root.foo).to.eq(snapshot.get('1'));
      expect(root.bar).to.eq(snapshot.get('2'));
    });

    it(`doesn't mark regenerated nodes as edited`, () => {
      expect(Array.from(editedNodeIds)).to.have.members(['1', '2']);
    });

    it(`contains the correct nodes`, () => {
      expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1', '2']);
    });

    it(`emits the edited nodes as an EntitySnapshot`, () => {
      expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(EntitySnapshot);
      expect(snapshot.getNodeSnapshot('1')).to.be.an.instanceOf(EntitySnapshot);
      expect(snapshot.getNodeSnapshot('2')).to.be.an.instanceOf(EntitySnapshot);
    });

  });

});
