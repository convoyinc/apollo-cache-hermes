import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { extract, restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`nested parameterized value`, () => {

    let restoreResult: GraphSnapshot;
    const parameterizedContainersId = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two', 'three'],
      { id: 1, withExtra: true }
    );

    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: {
              three: {
                id: '31',
                name: 'Three',
                extraValue: 42,
              },
            },
          },
        },
        `query getAFoo($id: ID!) {
          one {
            two {
              three(id: $id, withExtra: true) {
                id name extraValue
              }
            }
          }
        }`,
        { id: 1 }
      ).snapshot;

      restoreResult = restore(extract(snapshot));
    });

    it(`restores RootQuery NodeSnapshot JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          /* data */ undefined, 
          /* inbound */ undefined,
          [{ id: QueryRootId, path: ['one', 'two', 'three'] }],
        )
      );
    });

    it(`restores parameterized RootQuery NodeSnapshot JSON serialization object`, () => {
      const parameterizedContainersNode = restoreResult.getNodeSnapshot(parameterizedContainersId)!;
      const entityData = restoreResult.getNodeData('31');

      expect(parameterizedContainersNode).instanceof(ParameterizedValueSnapshot);
      expect(parameterizedContainersNode.inbound).to.have.members([{ id: QueryRootId, path: ['one', 'two', 'three'] }]);
      expect(parameterizedContainersNode.outbound).to.have.members([{ id: '31', path: [] }]);
      expect(parameterizedContainersNode.data).to.eq(entityData);
    });

    it(`restores id=31 NodeSnapshot JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot('31')).to.deep.eq(
        new EntitySnapshot(
          {
            id: '31',
            name: 'Three',
            extraValue: 42,
          },
          [{ id: parameterizedContainersId, path: [] }],
          /* outbound */ undefined
        )
      );
    });

  });
});
