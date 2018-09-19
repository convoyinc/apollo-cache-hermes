"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../src/context");
var GraphSnapshot_1 = require("../../../../src/GraphSnapshot");
var operations_1 = require("../../../../src/operations");
var helpers_1 = require("../../../helpers");
describe("operations.read", function () {
    var context = new context_1.CacheContext(helpers_1.silentConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    var shipmentsQuery = helpers_1.query("{\n    shipments {\n      id\n      driver {\n        name\n        id\n        messages(count: 2) {\n          details\n        }\n        seniority: tenure(unit: DAYS)\n      }\n      stopEtaSummary(limit: 2) {\n        id\n        type\n      }\n      vehicle: truck(index: 0) {\n        capacity\n      }\n    }\n  }");
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
                            seniority: 10,
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
                        vehicle: {
                            capacity: 100,
                        },
                    },
                    {
                        id: '1',
                        driver: {
                            name: 'Joe',
                            id: 'Joe-d1',
                            messages: [
                                { details: 'Hello' },
                            ],
                            seniority: 20,
                        },
                        stopEtaSummary: [
                            {
                                id: 'eta0',
                                type: 'warning',
                            },
                        ],
                        vehicle: {
                            capacity: 200,
                        },
                    },
                    {
                        driver: {},
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
                            seniority: 10,
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
                        vehicle: {
                            capacity: 100,
                        },
                    },
                    {
                        id: '1',
                        driver: {
                            name: 'Joe',
                            id: 'Joe-d1',
                            messages: [
                                { details: 'Hello' },
                            ],
                            seniority: 20,
                        },
                        stopEtaSummary: [
                            {
                                id: 'eta0',
                                type: 'warning',
                            },
                        ],
                        vehicle: {
                            capacity: 200,
                        },
                    },
                    {
                        id: null,
                        driver: {
                            name: null,
                            id: null,
                            messages: null,
                            seniority: null,
                        },
                        stopEtaSummary: null,
                        vehicle: null,
                    },
                ],
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5jb21wbGV0ZVBheWxvYWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmNvbXBsZXRlUGF5bG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1EQUF1RDtBQUN2RCwrREFBOEQ7QUFDOUQseURBQXNFO0FBQ3RFLDRDQUF1RDtBQUV2RCxRQUFRLENBQUMsaUJBQWlCLEVBQUU7SUFFMUIsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyxJQUFNLEtBQUssR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztJQUNsQyxJQUFNLGNBQWMsR0FBRyxlQUFLLENBQUMsa1VBbUIzQixDQUFDLENBQUM7SUFFSixRQUFRLENBQUMsb0JBQW9CLEVBQUU7UUFFN0IsSUFBSSxRQUF1QixDQUFDO1FBQzVCLElBQUksVUFBdUIsQ0FBQztRQUU1QixTQUFTLENBQUM7WUFDUixRQUFRLEdBQUcsa0JBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRTtnQkFDL0MsU0FBUyxFQUFFO29CQUNUO3dCQUNFLEVBQUUsRUFBRSxHQUFHO3dCQUNQLE1BQU0sRUFBRTs0QkFDTixJQUFJLEVBQUUsS0FBSzs0QkFDWCxFQUFFLEVBQUUsUUFBUTs0QkFDWixRQUFRLEVBQUU7Z0NBQ1IsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO2dDQUNwQixFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7NkJBQ3JCOzRCQUNELFNBQVMsRUFBRSxFQUFFO3lCQUNkO3dCQUNELGNBQWMsRUFBRTs0QkFDZDtnQ0FDRSxFQUFFLEVBQUUsTUFBTTtnQ0FDVixJQUFJLEVBQUUsU0FBUzs2QkFDaEI7NEJBQ0Q7Z0NBQ0UsRUFBRSxFQUFFLE1BQU07Z0NBQ1YsSUFBSSxFQUFFLFNBQVM7NkJBQ2hCO3lCQUNGO3dCQUNELE9BQU8sRUFBRTs0QkFDUCxRQUFRLEVBQUUsR0FBRzt5QkFDZDtxQkFDRjtvQkFDRDt3QkFDRSxFQUFFLEVB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