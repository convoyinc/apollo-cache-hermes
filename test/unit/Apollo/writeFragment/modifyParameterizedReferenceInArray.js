"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var EntitySnapshot_1 = require("../../../../src/nodes/EntitySnapshot");
var ParameterizedValueSnapshot_1 = require("../../../../src/nodes/ParameterizedValueSnapshot");
var SnapshotEditor_1 = require("../../../../src/operations/SnapshotEditor");
var context_1 = require("../../../helpers/context");
describe("writeFragment with paramterized references in an array", function () {
    var hermes;
    var fragments = graphql_tag_1.default("\n    fragment shipper on Shipper {\n      id\n      email\n    }\n\n    fragment shipment on Shipment {\n      id\n      address {\n        street\n      }\n      shipper(operation: $area) {\n        id\n        name\n      }\n    }\n  ");
    beforeAll(function () {
        hermes = new Hermes_1.Hermes(new CacheContext_1.CacheContext(context_1.strictConfig));
        hermes.writeQuery({
            query: graphql_tag_1.default("\n        query getViewer($city: String!, $area: String!) {\n          viewer {\n            id\n            name\n            __typename\n            shipments(destination: $city) {\n              id\n              __typename\n              address {\n                street\n                postal\n              }\n              shipper(operation: $area) {\n                id\n                __typename\n              }\n            }\n          }\n        }\n      "),
            variables: {
                city: 'Seattle',
                area: 'PNW',
            },
            data: {
                viewer: {
                    id: 123,
                    name: 'Gouda',
                    __typename: 'Viewer',
                    shipments: [
                        {
                            id: 'shipment0',
                            __typename: 'Shipment',
                            address: {
                                street: 'pike',
                                postal: 98102,
                            },
                            shipper: {
                                id: 'shipper0',
                                __typename: 'Shipper',
                            },
                        },
                        {
                            id: 'shipment1',
                            __typename: 'Shipment',
                            address: {
                                street: 'pine',
                                postal: 98102,
                            },
                            shipper: {
                                id: 'shipper1',
                                __typename: 'Shipper',
                            },
                        },
                    ],
                },
            },
        });
    });
    it("correctly update nested parameterized reference", function () {
        hermes.writeFragment({
            id: 'shipment0',
            fragment: fragments,
            fragmentName: 'shipment',
            variables: {
                area: 'PNW',
            },
            data: {
                id: 'shipment0',
                address: {
                    street: '4th & pike',
                },
                shipper: {
                    id: 'shipper0',
                    name: 'Munster',
                },
            },
        });
        var parameterizedShipmentId = SnapshotEditor_1.nodeIdForParameterizedValue('123', ['shipments'], { destination: 'Seattle' });
        var parameterizedShipperId = SnapshotEditor_1.nodeIdForParameterizedValue('shipment0', ['shipper'], { operation: 'PNW' });
        expect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot('shipment0')).to.deep.eq(new EntitySnapshot_1.EntitySnapshot({
            id: 'shipment0',
            __typename: 'Shipment',
            address: {
                street: '4th & pike',
                postal: 98102,
            },
        }, [{ id: parameterizedShipmentId, path: [0] }], [{ id: parameterizedShipperId, path: ['shipper'] }]));
        expect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot(parameterizedShipperId)).to.deep.eq(new ParameterizedValueSnapshot_1.ParameterizedValueSnapshot({
            id: 'shipper0',
            __typename: 'Shipper',
            name: 'Munster',
        }, [{ id: 'shipment0', path: ['shipper'] }], [{ id: 'shipper0', path: [] }]));
    });
    it("correctly update deeply nested reference", function () {
        hermes.writeFragment({
            id: 'shipper0',
            fragment: fragments,
            fragmentName: 'shipper',
            data: {
                id: 'shipper0',
                email: 'munster@monsterInc.com',
            },
        });
        expect(hermes.getCurrentCacheSnapshot().baseline.getNodeData('shipper0')).to.deep.eq({
            id: 'shipper0',
            __typename: 'Shipper',
            name: 'Munster',
            email: 'munster@monsterInc.com',
        });
    });
    it("correctly read cache after multiple writeFragments", function () {
        expect(hermes.readQuery({
            query: graphql_tag_1.default("\n      query readViewer($city: String!, $area: String!) {\n        viewer {\n          id\n          name\n          __typename\n          shipments(destination: $city) {\n            id\n            address {\n              street\n              postal\n            }\n            shipper(operation: $area) {\n              id\n            }\n          }\n        }\n      }\n    "),
            variables: {
                city: 'Seattle',
                area: 'PNW',
            },
        })).to.deep.eq({
            viewer: {
                id: 123,
                name: 'Gouda',
                __typename: 'Viewer',
                shipments: [
                    {
                        id: 'shipment0',
                        __typename: 'Shipment',
                        address: {
                            street: '4th & pike',
                            postal: 98102,
                        },
                        shipper: {
                            id: 'shipper0',
                            __typename: 'Shipper',
                            name: 'Munster',
                            email: 'munster@monsterInc.com',
                        },
                    },
                    {
                        id: 'shipment1',
                        __typename: 'Shipment',
                        address: {
                            street: 'pine',
                            postal: 98102,
                        },
                        shipper: {
                            id: 'shipper1',
                            __typename: 'Shipper',
                        },
                    },
                ],
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kaWZ5UGFyYW1ldGVyaXplZFJlZmVyZW5jZUluQXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb2RpZnlQYXJhbWV0ZXJpemVkUmVmZXJlbmNlSW5BcnJheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE4QjtBQUU5Qix3REFBdUQ7QUFDdkQscUVBQW9FO0FBQ3BFLHVFQUFzRTtBQUN0RSwrRkFBOEY7QUFDOUYsNEVBQXdGO0FBQ3hGLG9EQUF3RDtBQUV4RCxRQUFRLENBQUMsd0RBQXdELEVBQUU7SUFFakUsSUFBSSxNQUFjLENBQUM7SUFDbkIsSUFBTSxTQUFTLEdBQUcscUJBQUcsQ0FBQywrT0FnQnJCLENBQUMsQ0FBQztJQUVILFNBQVMsQ0FBQztRQUNSLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLDJCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUNoQixLQUFLLEVBQUUscUJBQUcsQ0FBQyx5ZEFvQlYsQ0FBQztZQUNGLFNBQVMsRUFBRTtnQkFDVCxJQUFJLEVBQUUsU0FBUztnQkFDZixJQUFJLEVBQUUsS0FBSzthQUNaO1lBQ0QsSUFBSSxFQUFFO2dCQUNKLE1BQU0sRUFBRTtvQkFDTixFQUFFLEVBQUUsR0FBRztvQkFDUCxJQUFJLEVBQUUsT0FBTztvQkFDYixVQUFVLEVBQUUsUUFBUTtvQkFDcEIsU0FBUyxFQUFFO3dCQUNUOzRCQUNFLEVBQUUsRUFBRSxXQUFXOzRCQUNmLFVBQVUsRUFBRSxVQUFVOzRCQUN0QixPQUFPLEVBQUU7Z0NBQ1AsTUFBTSxFQUFFLE1BQU07Z0NBQ2QsTUFBTSxFQUFFLEtBQUs7NkJBQ2Q7NEJBQ0QsT0FBTyxFQUFFO2dDQUNQLEVBQUUsRUFBRSxVQUFVO2dDQUNkLFVBQVUsRUFBRSxTQUFTOzZCQUN0Qjt5QkFDRjt3QkFDRDs0QkFDRSxFQUFFLEVBQUUsV0FBVzs0QkFDZixVQUFVLEVBQUUsVUFBVTs0QkFDdEIsT0FBTyxFQUFFO2dDQUNQLE1BQU0sRUFBRSxNQUFNO2dDQUNkLE1BQU0sRUFBRSxLQUFLOzZCQUNkOzRCQUNELE9BQU8sRUFBRTtnQ0FDUCxFQUFFLEVBQUUsVUFBVTtnQ0FDZCxVQUFVLEVBQUUsU0FBUzs2QkFDdEI7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGlEQUFpRCxFQUFFO1FBQ3BELE1BQU0sQ0FBQyxhQUFhLENBQUM7WUFDbkIsRUFBRSxFQUFFLFdBQVc7WUFDZixRQUFRLEVBQUUsU0FBUztZQUNuQixZQUFZLEVBQUUsVUFBVTtZQUN4QixTQUFTLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLEtBQUs7YUFDWjtZQUNELElBQUksRUFBRTtnQkFDSixFQUFFLEVBQUUsV0FBVztnQkFDZixPQUFPLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLFlBQVk7aUJBQ3JCO2dCQUNELE9BQU8sRUFBRTtvQkFDUCxFQUFFLEVBQUUsVUFBVTtvQkFDZCxJQUFJLEVBQUUsU0FBUztpQkFDaEI7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILElBQU0sdUJBQXVCLEdBQUcsNENBQTJCLENBQ3pELEtBQUssRUFDTCxDQUFDLFdBQVcsQ0FBQyxFQUNiLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxDQUMzQixDQUFDO1FBRUYsSUFBTSxzQkFBc0IsR0FBRyw0Q0FBMkIsQ0FDeEQsV0FBVyxFQUNYLENBQUMsU0FBUyxDQUFDLEVBQ1gsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQ3JCLENBQUM7UUFFRixNQUFNLENBQUMsTUFBTSxDQUFDLHVCQUF1QixFQUFFLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUN2RixJQUFJLCtCQUFjLENBQ2hCO1lBQ0UsRUFBRSxFQUFFLFdBQVc7WUFDZixVQUFVLEVBQUUsVUFBVTtZQUN0QixPQUFPLEVBQUU7Z0JBQ1AsTUFBTSxFQUFFLFlBQVk7Z0JBQ3BCLE1BQU0sRUFBRSxLQUFLO2FBQ2Q7U0FDRixFQUNELENBQUMsRUFBRSxFQUFFLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUM1QyxDQUFDLEVBQUUsRUFBRSxFQUFFLHNCQUFzQixFQUFFLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FDcEQsQ0FDRixDQUFDO1FBRUYsTUFBTSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUNsRyxJQUFJLHVEQUEwQixDQUM1QjtZQUNFLEVBQUUsRUFBRSxVQUFVO1lBQ2QsVUFBVSxFQUFFLFNBQVM7WUFDckIsSUFBSSxFQUFFLFNBQVM7U0FDaEIsRUFDRCxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQ3hDLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUMvQixDQUNGLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQywwQ0FBMEMsRUFBRTtRQUM3QyxNQUFNLENBQUMsYUFBYSxDQUFDO1lBQ25CLEVBQUUsRUFBRSxVQUFVO1lBQ2QsUUFBUSxFQUFFLFNBQVM7WUFDbkIsWUFBWSxFQUFFLFNBQVM7WUFDdkIsSUFBSSxFQUFFO2dCQUNKLEVBQUUsRUFBRSxVQUFVO2dCQUNkLEtBQUssRUFBRSx3QkFBd0I7YUFDaEM7U0FDRixDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsTUFBTSxDQUFDLHVCQUF1QixFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ25GLEVBQUUsRUFBRSxVQUFVO1lBQ2QsVUFBVSxFQUFFLFNBQVM7WUFDckIsSUFBSSxFQUFFLFNBQVM7WUFDZixLQUFLLEVBQUUsd0JBQXdCO1NBQ2hDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLG9EQUFvRCxFQUFFO1FBQ3ZELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDO1lBQ3RCLEtBQUssRUFBRSxxQkFBRyxDQUFDLGdZQWtCWixDQUFDO1lBQ0EsU0FBUyxFQUFFO2dCQUNULElBQUksRUFBRSxTQUFTO2dCQUNmLElBQUksRUFBRSxLQUFLO2FBQ1o7U0FDRixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNiLE1BQU0sRUFBRTtnQkFDTixFQUFFLEVBQUUsR0FBRztnQkFDUCxJQUFJLEVBQUUsT0FBTztnQkFDYixVQUFVLEVBQUUsUUFBUTtnQkFDcEIsU0FBUyxFQUFFO29CQUNUO3dCQUNFLEVBQUUsRUFBRSxXQUFXO3dCQUNmLFVBQVUsRUFBRSxVQUFVO3dCQUN0QixPQUFPLEVBQUU7NEJBQ1AsTUFBTSxFQUFFLFlBQVk7NEJBQ3BCLE1BQU0sRUFBRSxLQUFLO3lCQUNkO3dCQUNELE9BQU8sRUFBRTs0QkFDUCxFQUFFLEVBQUUsVUFBVTs0QkFDZCxVQUFVLEVBQUUsU0FBUzs0QkFDckIsSUFBSSxFQUFFLFNBQVM7NEJBQ2YsS0FBSyxFQUFFLHdCQUF3Qjt5QkFDaEM7cUJBQ0Y7b0JBQ0Q7d0JBQ0UsRUFBRSxFQUFFLFdBQVc7d0JBQ2YsVUFBVSxFQUFFLFVBQVU7d0JBQ3RCLE9BQU8sRUFBRTs0QkFDUCxNQUFNLEVBQUUsTUFBTTs0QkFDZCxNQUFNLEVBQUUsS0FBSzt5QkFDZDt3QkFDRCxPQUFPLEVBQUU7NEJBQ1AsRUFBRSxFQUFFLFVBQVU7NEJBQ2QsVUFBVSxFQUFFLFNBQVM7eUJBQ3RCO3FCQUNGO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=