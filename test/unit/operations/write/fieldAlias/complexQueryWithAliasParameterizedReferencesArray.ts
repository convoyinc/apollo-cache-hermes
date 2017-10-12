import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
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

  describe(`complex query with alias parameterized references array`, () => {

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      const nestedAliasQuery = query(`{
        shipments(first: 2) {
          shipmentsInfo: fields {
            id
            loads: contents {
              type: shipmentItemType
            }
            shipmentSize: dimensions {
              weight
              unit: weightUnit
            }
          }
        }
      }`);

      snapshot = write(context, empty, nestedAliasQuery, {
        shipments: {
          shipmentsInfo: [
            {
              id: 0,
              loads: [{ type: '26 Pallet' }, { type: 'Other' }],
              shipmentSize: { weight: 1000, unit: 'lb' },
            },
            {
              id: 1,
              loads: [{ type: '24 Pallet' }, { type: 'Other' }],
              shipmentSize: { weight: 2000, unit: 'lb' },
            },
          ],
        },
      }).snapshot;
    });

    it(`only writes fields from the schema`, () => {
      const parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['shipments'], { first: 2 });
      expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({
        fields: [
          {
            id: 0,
            contents: [{ shipmentItemType: '26 Pallet' }, { shipmentItemType: 'Other' }],
            dimensions: { weight: 1000, weightUnit: 'lb' },
          },
          {
            id: 1,
            contents: [{ shipmentItemType: '24 Pallet' }, { shipmentItemType: 'Other' }],
            dimensions: { weight: 2000, weightUnit: 'lb' },
          },
        ],
      });
    });

  });
});
