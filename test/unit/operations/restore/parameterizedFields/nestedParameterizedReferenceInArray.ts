import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../../../../../src/nodes';
import { extract, restore } from '../../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`nested parameterized value`, () => {

    const parameterizedIdElement0 = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two', 0, 'three'],
      { id: 1, withExtra: true }
    );

    const parameterizedIdElement1 = nodeIdForParameterizedValue(
      QueryRootId,
      ['one', 'two', 1, 'three'],
      { id: 1, withExtra: true }
    );

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: [
              {
                three: {
                  id: '30',
                  name: 'Three0',
                  extraValue: '30-42',
                },
              },
              {
                three: {
                  id: '31',
                  name: 'Three1',
                  extraValue: '31-42',
                },
              },
            ],
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

    it(`restores RootQuery NodeSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq(
        new EntitySnapshot(
          {
            one: {
              two: [],
            },
          },
          /* inbound */ undefined,
          [
            { id: QueryRootId, path: ['one', 'two', 0, 'three'] },
            { id: QueryRootId, path: ['one', 'two', 1, 'three'] },
          ]
        )
      );
    });

    it(`restores parameterized NodeSnapshot in an array at index=0 from JSON serialization object`, () => {
      const parameterizedElement0 = restoreResult.getNodeSnapshot(parameterizedIdElement0)!;
      const entityElement0 = restoreResult.getNodeData('30');

      expect(parameterizedElement0).instanceof(ParameterizedValueSnapshot);
      expect(parameterizedElement0.inbound).to.have.members([{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }]);
      expect(parameterizedElement0.outbound).to.have.members([{ id: '30', path: [] }]);
      expect(parameterizedElement0.data).to.eq(entityElement0);
    });

    it(`restores id=30 NodeSnapshot JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot('31')).to.deep.eq(
        new EntitySnapshot(
          {
            id: '31',
            name: 'Three1',
            extraValue: '31-42',
          },
          [{ id: parameterizedIdElement1, path: [] }],
          /* outbound */ undefined
        )
      );
    });

    it(`restores parameterized NodeSnapshot at index=1 from JSON serialization object`, () => {
      const parameterizedElement1 = restoreResult.getNodeSnapshot(parameterizedIdElement1)!;
      const entityElement1 = restoreResult.getNodeData('31');

      expect(parameterizedElement1).instanceof(ParameterizedValueSnapshot);
      expect(parameterizedElement1.inbound).to.have.members([{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }]);
      expect(parameterizedElement1.outbound).to.have.members([{ id: '31', path: [] }]);
      expect(parameterizedElement1.data).to.eq(entityElement1);
    });

    it(`restores id=31 NodeSnapshot JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot('30')).to.deep.eq(
        new EntitySnapshot(
          {
            id: '30',
            name: 'Three0',
            extraValue: '30-42',
          },
          [{ id: parameterizedIdElement0, path: [] }],
          /* outbound */ undefined
        )
      );
    });

  });
});
