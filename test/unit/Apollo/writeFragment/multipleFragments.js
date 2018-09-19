"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("writeFragment with multiple fragments", function () {
    var hermes;
    var fragments = graphql_tag_1.default("\n    fragment viewer on Viewer {\n      id\n      nameViewer\n    }\n\n    fragment shipment on Shipment {\n      id\n      name\n      begin\n      end\n    }\n  ");
    beforeAll(function () {
        hermes = new Hermes_1.Hermes(new CacheContext_1.CacheContext(context_1.strictConfig));
        hermes.restore((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                outbound: [{ id: '123', path: ['viewer'] }],
                data: {
                    justValue: '42',
                },
            },
            _a['123'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: QueryRootId, path: ['viewer'] }],
                outbound: [{ id: 'shipment0', path: ['shipment'] }],
                data: {
                    id: 123,
                    nameViewer: 'Gouda',
                    __typename: 'Viewer',
                },
            },
            _a['shipment0'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: '123', path: ['shipment'] }],
                data: {
                    id: 'shipment0',
                    __typename: 'Shipment',
                },
            },
            _a));
        var _a;
    });
    it("correctly write a 'viewer' fragment", function () {
        hermes.writeFragment({
            id: '123',
            fragmentName: 'viewer',
            fragment: fragments,
            data: {
                id: 123,
                nameViewer: 'Munster',
            },
        });
        expect(hermes.getCurrentCacheSnapshot().baseline.getNodeData('123')).to.deep.eq({
            id: 123,
            nameViewer: 'Munster',
            __typename: 'Viewer',
            shipment: {
                id: 'shipment0',
                __typename: 'Shipment',
            },
        });
    });
    it("correctly write a 'shipment' fragment", function () {
        hermes.writeFragment({
            id: 'shipment0',
            fragmentName: 'shipment',
            fragment: fragments,
            data: {
                id: 'shipment0',
                name: 'Shipping some Cheese',
                begin: 'Seattle',
                end: 'West Seattle',
            },
        });
        expect(hermes.getCurrentCacheSnapshot().baseline.getNodeData('shipment0')).to.deep.eq({
            id: 'shipment0',
            name: 'Shipping some Cheese',
            begin: 'Seattle',
            end: 'West Seattle',
            __typename: 'Shipment',
        });
    });
    it("correctly modify 'viewer' reference", function () {
        expect(hermes.getCurrentCacheSnapshot().baseline.getNodeData('123')).to.deep.eq({
            id: 123,
            nameViewer: 'Munster',
            __typename: 'Viewer',
            shipment: {
                id: 'shipment0',
                name: 'Shipping some Cheese',
                begin: 'Seattle',
                end: 'West Seattle',
                __typename: 'Shipment',
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlwbGVGcmFnbWVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtdWx0aXBsZUZyYWdtZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE4QjtBQUU5Qix3REFBdUQ7QUFDdkQscUVBQW9FO0FBQ3BFLGlEQUFvRTtBQUNwRSxvREFBd0Q7QUFFaEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLHVDQUF1QyxFQUFFO0lBRWhELElBQUksTUFBYyxDQUFDO0lBQ25CLElBQU0sU0FBUyxHQUFHLHFCQUFHLENBQUMsc0tBWXJCLENBQUMsQ0FBQztJQUVILFNBQVMsQ0FBQztRQUNSLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLDJCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLE9BQU87WUFDWixHQUFDLFdBQVcsSUFBRztnQkFDYixJQUFJLHdCQUE4QztnQkFDbEQsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzNDLElBQUksRUFBRTtvQkFDSixTQUFTLEVBQUUsSUFBSTtpQkFDaEI7YUFDRjtZQUNELFNBQUssR0FBRTtnQkFDTCxJQUFJLHdCQUE4QztnQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxJQUFJLEVBQUU7b0JBQ0osRUFBRSxFQUFFLEdBQUc7b0JBQ1AsVUFBVSxFQUFFLE9BQU87b0JBQ25CLFVBQVUsRUFBRSxRQUFRO2lCQUNyQjthQUNGO1lBQ0QsZUFBVyxHQUFFO2dCQUNYLElBQUksd0JBQThD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