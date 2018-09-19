"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var context_1 = require("../../../helpers/context");
describe("writeFragment with parameterized references within arrays", function () {
    var hermes;
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
    it("returns parameterized data", function () {
        expect(hermes.readFragment({
            id: '123',
            fragment: graphql_tag_1.default("\n      fragment viewer on Viewer {\n        id\n        name\n        __typename\n        shipments(destination: $city) {\n          id\n          address {\n            street\n            postal\n          }\n          shipper(operation: $area) {\n            id\n          }\n        }\n      }\n    "),
            variables: {
                city: 'Seattle',
                area: 'PNW',
            },
        })).to.deep.eq({
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
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVyaXplZFJlZmVyZW5jZUluQXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwYXJhbWV0ZXJpemVkUmVmZXJlbmNlSW5BcnJheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE4QjtBQUU5Qix3REFBdUQ7QUFDdkQscUVBQW9FO0FBQ3BFLG9EQUF3RDtBQUV4RCxRQUFRLENBQUMsMkRBQTJELEVBQUU7SUFFcEUsSUFBSSxNQUFjLENBQUM7SUFDbkIsU0FBUyxDQUFDO1FBQ1IsTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksMkJBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUMsQ0FBQztRQUNwRCxNQUFNLENBQUMsVUFBVSxDQUFDO1lBQ2hCLEtBQUssRUFBRSxxQkFBRyxDQUFDLHlkQW9CVixDQUFDO1lBQ0YsU0FBUyxFQUFFO2dCQUNULElBQUksRUFBRSxTQUFTO2dCQUNmLElBQUksRUFBRSxLQUFLO2FBQ1o7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osTUFBTSxFQUFFO29CQUNOLEVBQUUsRUFBRSxHQUFHO29CQUNQLElBQUksRUFBRSxPQUFPO29CQUNiLFVBQVUsRUFBRSxRQUFRO29CQUNwQixTQUFTLEVBQUU7d0JBQ1Q7NEJBQ0UsRUFBRSxFQUFFLFdBQVc7NEJBQ2YsVUFBVSxFQUFFLFVBQVU7NEJBQ3RCLE9BQU8sRUFBRTtnQ0FDUCxNQUFNLEVBQUUsTUFBTTtnQ0FDZCxNQUFNLEVBQUUsS0FBSzs2QkFDZDs0QkFDRCxPQUFPLEVBQUU7Z0NBQ1AsRUFBRSxFQUFFLFVBQVU7Z0NBQ2QsVUFBVSxFQUFFLFNBQVM7NkJBQ3RCO3lCQUNGO3dCQUNEOzRCQUNFLEVBQUUsRUFBRSxXQUFXOzRCQUNmLFVBQVUsRUFBRSxVQUFVOzRCQUN0QixPQUFPLEVBQUU7Z0NBQ1AsTUFBTSxFQUFFLE1BQU07Z0NBQ2QsTUFBTSxFQUFFLEtBQUs7NkJBQ2Q7NEJBQ0QsT0FBTyxFQUFFO2dDQUNQLEVBQUUsRUFBRSxVQUFVO2dDQUNkLFVBQVUsRUFBRSxTQUFTOzZCQUN0Qjt5QkFDRjtxQkFDRjtpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsNEJBQTRCLEVBQUU7UUFDL0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7WUFDekIsRUFBRSxFQUFFLEtBQUs7WUFDVCxRQUFRLEVBQUUscUJBQUcsQ0FBQyxrVEFnQmYsQ0FBQztZQUNBLFNBQVMsRUFBRTtnQkFDVCxJQUFJLEVBQUUsU0FBUztnQkFDZixJQUFJLEVBQUUsS0FBSzthQUNaO1NBQ0YsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDYixFQUFFLEVBQUUsR0FBRztZQUNQLElBQUksRUFBRSxPQUFPO1lBQ2IsVUFBVSxFQUFFLFFBQVE7WUFDcEIsU0FBUyxFQUFFO2dCQUNUO29CQUNFLEVBQUUsRUFBRSxXQUFXO29CQUNmLFVBQVUsRUFBRSxVQUFVO29CQUN0QixPQUFPLEVBQUU7d0JBQ1AsTUFBTSxFQUFFLE1BQU07d0JBQ2QsTUFBTSxFQUFFLEtBQUs7cUJBQ2Q7b0JBQ0QsT0FBTyxFQUFFO3dCQUNQLEVBQUUsRUFBRSxVQUFVO3dCQUNkLFVBQVUsRUFBRSxTQUFTO3FCQUN0QjtpQkFDRjtnQkFDRDtvQkFDRSxFQUFFLEVBQUUsV0FBVztvQkFDZixVQUFVLEVBQUUsVUFBVTtvQkFDdEIsT0FBTyxFQUFFO3dCQUNQLE1BQU0sRUFBRSxNQUFNO3dCQUNkLE1BQU0sRUFBRSxLQUFLO3FCQUNkO29CQUNELE9BQU8sRUFBRTt3QkFDUCxFQUFFLEVBQUUsVUFBVTt3QkFDZCxVQUFVLEVBQUUsU0FBUztxQkFDdEI7aUJBQ0Y7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==