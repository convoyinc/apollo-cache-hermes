"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var write_1 = require("../../../../../src/operations/write");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe("operations.write", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    describe("complex query with alias parameterized references array", function () {
        var snapshot;
        beforeAll(function () {
            var nestedAliasQuery = helpers_1.query("{\n        shipments(first: 2) {\n          shipmentsInfo: fields {\n            id\n            loads: contents {\n              type: shipmentItemType\n            }\n            shipmentSize: dimensions {\n              weight\n              unit: weightUnit\n            }\n          }\n        }\n      }");
            snapshot = write_1.write(context, empty, nestedAliasQuery, {
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
        it("only writes fields from the schema", function () {
            var parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['shipments'], { first: 2 });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxleFF1ZXJ5V2l0aEFsaWFzUGFyYW1ldGVyaXplZFJlZmVyZW5jZXNBcnJheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbXBsZXhRdWVyeVdpdGhBbGlhc1BhcmFtZXRlcml6ZWRSZWZlcmVuY2VzQXJyYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzREFBMEQ7QUFDMUQsa0VBQWlFO0FBQ2pFLCtFQUEyRjtBQUMzRiw2REFBNEQ7QUFDNUQsb0RBQXlEO0FBQ3pELCtDQUEwRDtBQUVsRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBRTNCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFFbEMsUUFBUSxDQUFDLHlEQUF5RCxFQUFFO1FBRWxFLElBQUksUUFBdUIsQ0FBQztRQUM1QixTQUFTLENBQUM7WUFDUixJQUFNLGdCQUFnQixHQUFHLGVBQUssQ0FBQyx1VEFhN0IsQ0FBQyxDQUFDO1lBRUosUUFBUSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFO2dCQUNqRCxTQUFTLEVBQUU7b0JBQ1QsYUFBYSxFQUFFO3dCQUNiOzRCQUNFLEVBQUUsRUFBRSxDQUFDOzRCQUNMLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDOzRCQUNqRCxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7eUJBQzNDO3dCQUNEOzRCQUNFLEVBQUUsRUFBRSxDQUFDOzRCQUNMLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDOzRCQUNqRCxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7eUJBQzNDO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDLFFBQVEsQ0FBQztRQUNkLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFO1lBQ3ZDLElBQU0sZUFBZSxHQUFHLDRDQUEyQixDQUFDLFdBQVcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdkQsTUFBTSxFQUFFO29CQUNOO3dCQUNFLEVBQUUsRUFBRSxDQUFDO3dCQUNMLFFBQVEsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsQ0FBQzt3QkFDNUUsVUFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFO3FCQUMvQztvQkFDRDt3QkFDRSxFQUFFLEVBQUUsQ0FBQzt3QkFDTCxRQUFRLEVBQUUsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLENBQUM7d0JBQzVFLFVBQVUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTtxQkFDL0M7aUJBQ0Y7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==