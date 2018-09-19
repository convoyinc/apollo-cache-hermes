"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../src/context");
var GraphSnapshot_1 = require("../../../../src/GraphSnapshot");
var operations_1 = require("../../../../src/operations");
var helpers_1 = require("../../../helpers");
describe("operations.read", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    var shipmentsQuery = helpers_1.query("{\n    shipments {\n      id\n      driver {\n        name\n        id\n        messages(count: 2) {\n          details\n        }\n      }\n      stopEtaSummary(limit: 2) {\n        id\n        type\n      }\n    }\n  }");
    describe("incomplete payload", function () {
        var snapshot;
        var readResult;
        beforeAll(function () {
            snapshot = operations_1.write(context, empty, shipmentsQuery, {
                shipments: [
                    {
                        id: '0',
                        driver: {
                            name: 'Bob',
                            id: 'Bob-d0',
                            messages: [
                                { details: 'Hello' },
                                { details: 'world' },
                            ],
                        },
                        stopEtaSummary: [
                            {
                                id: 'eta0',
                                type: 'warning',
                            },
                            {
                                id: 'eta1',
                                type: 'warning',
                            },
                        ],
                        extraProp: 'Oh mind!',
                    },
                    {
                        id: '1',
                        driver: {
                            name: 'Joe',
                            id: 'Joe-d1',
                            messages: [
                                { details: 'Hello' },
                            ],
                        },
                        stopEtaSummary: [
                            {
                                id: 'eta0',
                                type: 'warning',
                            },
                        ],
                        extraObject: 'WAT!!!',
                    },
                ],
            }).snapshot;
            readResult = operations_1.read(context, shipmentsQuery, snapshot);
        });
        it("verify that read result is complete", function () {
            expect(readResult.complete).to.eq(true);
        });
        it("verify that read result is correct", function () {
            expect(readResult.result).to.deep.eq({
                shipments: [
                    {
                        id: '0',
                        driver: {
                            name: 'Bob',
                            id: 'Bob-d0',
                            messages: [
                                { details: 'Hello' },
                                { details: 'world' },
                            ],
                        },
                        stopEtaSummary: [
                            {
                                id: 'eta0',
                                type: 'warning',
                            },
                            {
                                id: 'eta1',
                                type: 'warning',
                            },
                        ],
                    },
                    {
                        id: '1',
                        driver: {
                            name: 'Joe',
                            id: 'Joe-d1',
                            messages: [
                                { details: 'Hello' },
                            ],
                        },
                        stopEtaSummary: [
                            {
                                id: 'eta0',
                                type: 'warning',
                            },
                        ],
                    },
                ],
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cmFQcm9wZXJ0eUluUGF5bG9hZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4dHJhUHJvcGVydHlJblBheWxvYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtREFBdUQ7QUFDdkQsK0RBQThEO0FBQzlELHlEQUFzRTtBQUN0RSw0Q0FBdUQ7QUFFdkQsUUFBUSxDQUFDLGlCQUFpQixFQUFFO0lBRTFCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFDbEMsSUFBTSxjQUFjLEdBQUcsZUFBSyxDQUFDLDhOQWUzQixDQUFDLENBQUM7SUFFSixRQUFRLENBQUMsb0JBQW9CLEVBQUU7UUFFN0IsSUFBSSxRQUF1QixDQUFDO1FBQzVCLElBQUksVUFBdUIsQ0FBQztRQUU1QixTQUFTLENBQUM7WUFDUixRQUFRLEdBQUcsa0JBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRTtnQkFDL0MsU0FBUyxFQUFFO29CQUNUO3dCQUNFLEVBQUUsRUFBRSxHQUFHO3dCQUNQLE1BQU0sRUFBRTs0QkFDTixJQUFJLEVBQUUsS0FBSzs0QkFDWCxFQUFFLEVBQUUsUUFBUTs0QkFDWixRQUFRLEVBQUU7Z0NBQ1IsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO2dDQUNwQixFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7NkJBQ3JCO3lCQUNGO3dCQUNELGNBQWMsRUFBRTs0QkFDZDtnQ0FDRSxFQUFFLEVBQUUsTUFBTTtnQ0FDVixJQUFJLEVBQUUsU0FBUzs2QkFDaEI7NEJBQ0Q7Z0NBQ0UsRUFBRSxFQUFFLE1BQU07Z0NBQ1YsSUFBSSxFQUFFLFNBQVM7NkJBQ2hCO3lCQUNGO3dCQUNELFNBQVMsRUFBRSxVQUFVO3FCQUN0QjtvQkFDRDt3QkFDRSxFQUFFLEVBQUUsR0FBRzt3QkFDUCxNQUFNLEVBQUU7NEJBQ04sSUFBSSxFQUFFLEtBQUs7NEJBQ1gsRUFBRSxFQUFFLFFBQVE7NEJBQ1osUUFBUSxFQUFFO2dDQUNSLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTs2QkFDckI7eUJBQ0Y7d0JBQ0QsY0FBYyxFQUFFOzRCQUNkO2dDQUNFLEVBQUUsRUFBRSxNQUFNO2dDQUNWLElBQUksRUFBRSxTQUFTOzZCQUNoQjt5QkFDRjt3QkFDRCxXQUFXLEVBQUUsUUFBUTtxQkFDdEI7aUJBQ0Y7YUFDRixDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ1osVUFBVSxHQUFHLGlCQUFJLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2RCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxxQ0FBcUMsRUFBRTtZQUN4QyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsb0NBQW9DLEVBQUU7WUFDdkMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsU0FBUyxFQUFFO29CQUNUO3dCQUNFLEVBQUUsRUFBRSxHQUFHO3dCQUNQLE1BQU0sRUFBRTs0QkFDTixJQUFJLEVBQUUsS0FBSzs0QkFDWCxFQUFFLEVBQUUsUUFBUTs0QkFDWixRQUFRLEVBQUU7Z0NBQ1IsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO2dDQUNwQixFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7NkJBQ3JCO3lCQUNGO3dCQUNELGNBQWMsRUFBRTs0QkFDZDtnQ0FDRSxFQUFFLEVBQUUsTUFBTTtnQ0FDVixJQUFJLEVBQUUsU0FBUzs2QkFDaEI7NEJBQ0Q7Z0NBQ0UsRUFBRSxFQUFFLE1BQU07Z0NBQ1YsSUFBSSxFQUFFLFNBQVM7NkJBQ2hCO3lCQUNGO3FCQUNGO29CQUNEO3dCQUNFLEVBQUUsRUFBRSxHQUFHO3dCQUNQLE1BQU0sRUFBRTs0QkFDTixJQUFJLEVBQUUsS0FBSzs0QkFDWCxFQUFFLEVBQUUsUUFBUTs0QkFDWixRQUFRLEVBQUU7Z0NBQ1IsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFOzZCQUNyQjt5QkFDRjt3QkFDRCxjQUFjLEVBQUU7NEJBQ2Q7Z0NBQ0UsRUFBRSxFQUFFLE1BQU07Z0NBQ1YsSUFBSSxFQUFFLFNBQVM7NkJBQ2hCO3lCQUNGO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=