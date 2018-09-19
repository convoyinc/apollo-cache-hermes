"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../src/context");
var GraphSnapshot_1 = require("../../../../src/GraphSnapshot");
var operations_1 = require("../../../../src/operations");
var helpers_1 = require("../../../helpers");
describe("operations.read", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    describe("field alias", function () {
        describe("without parameterized arguments", function () {
            it("simple alias", function () {
                var aliasQuery = helpers_1.query("{\n          user {\n            userId: id\n            userName: name\n          }\n        }");
                var snapshot = operations_1.write(context, empty, aliasQuery, {
                    user: {
                        userId: 0,
                        userName: 'Foo',
                    },
                }).snapshot;
                var result = operations_1.read(context, aliasQuery, snapshot).result;
                expect(result).to.deep.eq({
                    user: {
                        id: 0,
                        userId: 0,
                        name: 'Foo',
                        userName: 'Foo',
                    },
                });
            });
            it("nested alias", function () {
                var aliasQuery = helpers_1.query("{\n          superUser: user {\n            userId: id\n            userName: name\n          }\n          user {\n            id\n            name\n          }\n        }");
                var snapshot = operations_1.write(context, empty, aliasQuery, {
                    superUser: {
                        userId: 0,
                        userName: 'Foo',
                    },
                    user: {
                        id: 100,
                        name: 'Baz',
                    },
                }).snapshot;
                var result = operations_1.read(context, aliasQuery, snapshot).result;
                expect(result).to.deep.eq({
                    superUser: {
                        id: 100,
                        userId: 100,
                        name: 'Baz',
                        userName: 'Baz',
                    },
                    user: {
                        id: 100,
                        name: 'Baz',
                    },
                });
            });
        });
        describe("with parameterized arguments", function () {
            it("simple alias", function () {
                var aliasQuery = helpers_1.query("{\n          superUser: user(id: 4) {\n            ID: id\n            FirstName: name\n          }\n        }");
                var snapshot = operations_1.write(context, empty, aliasQuery, {
                    superUser: {
                        ID: 0,
                        FirstName: 'Baz',
                    },
                }).snapshot;
                var result = operations_1.read(context, aliasQuery, snapshot).result;
                expect(result).to.deep.eq({
                    superUser: {
                        id: 0,
                        ID: 0,
                        name: 'Baz',
                        FirstName: 'Baz',
                    },
                });
            });
            it("with variables", function () {
                var aliasQuery = helpers_1.query("\n          query getUser($id: ID!) {\n            fullUser: user(id: $id) {\n              firstName: FirstName,\n              id\n              address: Address {\n                city\n                state\n              }\n            }\n            user(id: $id) {\n              FirstName\n              id\n            }\n          }\n        ", { id: 2 });
                var snapshot = operations_1.write(context, empty, aliasQuery, {
                    fullUser: {
                        firstName: 'Bob',
                        id: 2,
                        address: {
                            city: 'A',
                            state: 'AA',
                        },
                    },
                    user: {
                        FirstName: 'Bob',
                        id: 2,
                    },
                }).snapshot;
                var result = operations_1.read(context, aliasQuery, snapshot).result;
                expect(result).to.deep.eq({
                    fullUser: {
                        firstName: 'Bob',
                        FirstName: 'Bob',
                        id: 2,
                        address: {
                            city: 'A',
                            state: 'AA',
                        },
                        Address: {
                            city: 'A',
                            state: 'AA',
                        },
                    },
                    user: {
                        FirstName: 'Bob',
                        id: 2,
                        Address: {
                            city: 'A',
                            state: 'AA',
                        },
                    },
                });
            });
            it("complex nested alias", function () {
                var nestedAliasQuery = helpers_1.query("{\n          shipments(first: 2) {\n            shipmentsInfo: fields {\n              id\n              loads: contents {\n                type: shipmentItemType\n              }\n              shipmentSize: dimensions {\n                weight\n                unit: weightUnit\n              }\n            }\n          }\n        }");
                var snapshot = operations_1.write(context, empty, nestedAliasQuery, {
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
                var result = operations_1.read(context, nestedAliasQuery, snapshot).result;
                expect(result).to.deep.eq({
                    shipments: {
                        shipmentsInfo: [
                            {
                                id: 0,
                                loads: [{ type: '26 Pallet', shipmentItemType: '26 Pallet' }, { type: 'Other', shipmentItemType: 'Other' }],
                                contents: [{ shipmentItemType: '26 Pallet' }, { shipmentItemType: 'Other' }],
                                shipmentSize: { weight: 1000, unit: 'lb', weightUnit: 'lb' },
                                dimensions: { weight: 1000, weightUnit: 'lb' },
                            },
                            {
                                id: 1,
                                loads: [{ type: '24 Pallet', shipmentItemType: '24 Pallet' }, { type: 'Other', shipmentItemType: 'Other' }],
                                contents: [{ shipmentItemType: '24 Pallet' }, { shipmentItemType: 'Other' }],
                                shipmentSize: { weight: 2000, unit: 'lb', weightUnit: 'lb' },
                                dimensions: { weight: 2000, weightUnit: 'lb' },
                            },
                        ],
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
                    },
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmllbGRBbGlhcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZpZWxkQWxpYXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtREFBdUQ7QUFDdkQsK0RBQThEO0FBQzlELHlEQUF5RDtBQUN6RCw0Q0FBdUQ7QUFFdkQsUUFBUSxDQUFDLGlCQUFpQixFQUFFO0lBRTFCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFFbEMsUUFBUSxDQUFDLGFBQWEsRUFBRTtRQUN0QixRQUFRLENBQUMsaUNBQWlDLEVBQUU7WUFDMUMsRUFBRSxDQUFDLGNBQWMsRUFBRTtnQkFDakIsSUFBTSxVQUFVLEdBQUcsZUFBSyxDQUFDLGlHQUt2QixDQUFDLENBQUM7Z0JBRUosSUFBTSxRQUFRLEdBQUcsa0JBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRTtvQkFDakQsSUFBSSxFQUFFO3dCQUNKLE1BQU0sRUFBRSxDQUFDO3dCQUNULFFBQVEsRUFBRSxLQUFLO3FCQUNoQjtpQkFDRixDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUVKLElBQUEsZ0VBQU0sQ0FBeUM7Z0JBQ3ZELE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDeEIsSUFBSSxFQUFFO3dCQUNKLEVBQUUsRUFBRSxDQUFDO3dCQUNMLE1BQU0sRUFBRSxDQUFDO3dCQUNULElBQUksRUFBRSxLQUFLO3dCQUNYLFFBQVEsRUFBRSxLQUFLO3FCQUNoQjtpQkFDRixDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztZQUVILEVBQUUsQ0FBQyxjQUFjLEVBQUU7Z0JBQ2pCLElBQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyw2S0FTdkIsQ0FBQyxDQUFDO2dCQUVKLElBQU0sUUFBUSxHQUFHLGtCQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7b0JBQ2pELFNBQVMsRUFBRTt3QkFDVCxNQUFNLEVBQUUsQ0FBQzt3QkFDVCxRQUFRLEVBQUUsS0FBSztxQkFDaEI7b0JBQ0QsSUFBSSxFQUFFO3dCQUNKLEVBQUUsRUFBRSxHQUFHO3dCQUNQLElBQUksRUFBRSxLQUFLO3FCQUNaO2lCQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBRUosSUFBQSxnRUFBTSxDQUF5QztnQkFDdkQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN4QixTQUFTLEVBQUU7d0JBQ1QsRUFBRSxFQUFFLEdBQUc7d0JBQ1AsTUFBTSxFQUFFLEdBQUc7d0JBQ1gsSUFBSSxFQUFFLEtBQUs7d0JBQ1gsUUFBUSxFQUFFLEtBQUs7cUJBQ2hCO29CQUNELElBQUksRUFBRTt3QkFDSixFQUFFLEVBQUUsR0FBRzt3QkFDUCxJQUFJLEVBQUUsS0FBSztxQkFDWjtpQkFDRixDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLDhCQUE4QixFQUFFO1lBQ3ZDLEVBQUUsQ0FBQyxjQUFjLEVBQUU7Z0JBQ2pCLElBQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyxnSEFLdkIsQ0FBQyxDQUFDO2dCQUVKLElBQU0sUUFBUSxHQUFHLGtCQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7b0JBQ2pELFNBQVMsRUFBRTt3QkFDVCxFQUFFLEVBQUUsQ0FBQzt3QkFDTCxTQUFTLEVBQUUsS0FBSztxQkFDakI7aUJBQ0YsQ0FBQyxDQUFDLFFBQVEsQ0FBQztnQkFFSixJQUFBLGdFQUFNLENBQXlDO2dCQUN2RCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3hCLFNBQVMsRUFBRTt3QkFDVCxFQUFFLEVBQUUsQ0FBQzt3QkFDTCxFQUFFLEVBQUUsQ0FBQzt3QkFDTCxJQUFJLEVBQUUsS0FBSzt3QkFDWCxTQUFTLEVBQUUsS0FBSztxQkFDakI7aUJBQ0YsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQ25CLElBQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyxrV0FleEIsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNkLElBQU0sUUFBUSxHQUFHLGtCQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7b0JBQ2pELFFBQVEsRUFBRTt3QkFDUixTQUFTLEVBQUUsS0FBSzt3QkFDaEIsRUFBRSxFQUFFLENBQUM7d0JBQ0wsT0FBTyxFQUFFOzRCQUNQLElBQUksRUFBRSxHQUFHOzRCQUNULEtBQUssRUFBRSxJQUFJO3lCQUNaO3FCQUNGO29CQUNELElBQUksRUFBRTt3QkFDSixTQUFTLEVBQUUsS0FBSzt3QkFDaEIsRUFBRSxFQUFFLENBQUM7cUJBQ047aUJBQ0YsQ0FBQyxDQUFDLFFBQVEsQ0FBQztnQkFFSixJQUFBLGdFQUFNLENBQXlDO2dCQUN2RCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3hCLFFBQVEsRUFBRTt3QkFDUixTQUFTLEVBQUUsS0FBSzt3QkFDaEIsU0FBUyxFQUFFLEtBQUs7d0JBQ2hCLEVBQUUsRUFBRSxDQUFDO3dCQUNMLE9BQU8sRUFBRTs0QkFDUCxJQUFJLEVBQUUsR0FBRzs0QkFDVCxLQUFLLEVBQUUsSUFBSTt5QkFDWjt3QkFDRCxPQUFPLEVBQUU7NEJBQ1AsSUFBSSxFQUFFLEdBQUc7NEJBQ1QsS0FBSyxFQUFFLElBQUk7eUJBQ1o7cUJBQ0Y7b0JBQ0QsSUFBSSxFQUFFO3dCQUNKLFNBQVMsRUFBRSxLQUFLO3dCQUNoQixFQUFFLEVBQUUsQ0FBQzt3QkFDTCxPQUFPLEVBQUU7NEJBQ1AsSUFBSSxFQUFFLEdBQUc7NEJBQ1QsS0FBSyxFQUFFLElBQUk7eUJBQ1o7cUJBQ0Y7aUJBQ0YsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMsc0JBQXNCLEVBQUU7Z0JBQ3pCLElBQU0sZ0JBQWdCLEdBQUcsZUFBSyxDQUFDLGlWQWE3QixDQUFDLENBQUM7Z0JBRUosSUFBTSxRQUFRLEdBQUcsa0JBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFO29CQUN2RCxTQUFTLEVBQUU7d0JBQ1QsYUFBYSxFQUFFOzRCQUNiO2dDQUNFLEVBQUUsRUFBRSxDQUFDO2dDQUNMLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDO2dDQUNqRCxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7NkJBQzNDOzRCQUNEO2dDQUNFLEVBQUUsRUFBRSxDQUFDO2dDQUNMLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDO2dDQUNqRCxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7NkJBQzNDO3lCQUNGO3FCQUNGO2lCQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBRUosSUFBQSxzRUFBTSxDQUErQztnQkFDN0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN4QixTQUFTLEVBQUU7d0JBQ1QsYUFBYSxFQUFFOzRCQUNiO2dDQUNFLEVBQUUsRUFBRSxDQUFDO2dDQUNMLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLENBQUM7Z0NBQzNHLFFBQVEsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsQ0FBQztnQ0FDNUUsWUFBWSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7Z0NBQzVELFVBQVUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTs2QkFDL0M7NEJBQ0Q7Z0NBQ0UsRUFBRSxFQUFFLENBQUM7Z0NBQ0wsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsQ0FBQztnQ0FDM0csUUFBUSxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxDQUFDO2dDQUM1RSxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTtnQ0FDNUQsVUFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFOzZCQUMvQzt5QkFDRjt3QkFDRCxNQUFNLEVBQUU7NEJBQ047Z0NBQ0UsRUFBRSxFQUFFLENBQUM7Z0NBQ0wsUUFBUSxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxDQUFDO2dDQUM1RSxVQUFVLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7NkJBQy9DOzRCQUNEO2dDQUNFLEVBQUUsRUFBRSxDQUFDO2dDQUNMLFFBQVEsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsQ0FBQztnQ0FDNUUsVUFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFOzZCQUMvQzt5QkFDRjtxQkFDRjtpQkFDRixDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUVMLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9