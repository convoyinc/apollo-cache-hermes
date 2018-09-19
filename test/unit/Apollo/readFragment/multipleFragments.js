"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("readFragment with multiple fragments", function () {
    var hermes;
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
                data: { id: 123, name: 'Gouda', __typename: 'Viewer' },
            },
            _a['shipment0'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: 123, path: ['shipment'] }],
                data: {
                    id: 'shipment0',
                    destination: 'Seattle',
                    __typename: 'Shipment',
                },
            },
            _a));
        var _a;
    });
    it("returns a value following the named fragment ('viewer')", function () {
        expect(hermes.readFragment({
            id: '123',
            fragmentName: 'viewer',
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          name\n          __typename\n        }\n\n        fragment shipment on Shipment {\n          id\n          destination\n          __typename\n        }\n      "),
        })).to.be.deep.eq({
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
            shipment: {
                id: 'shipment0',
                destination: 'Seattle',
                __typename: 'Shipment',
            },
        });
    });
    it("returns a value following the named fragment ('shipment')", function () {
        expect(hermes.readFragment({
            id: 'shipment0',
            fragmentName: 'shipment',
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          name\n        }\n\n        fragment shipment on Shipment {\n          id\n          destination\n          __typename\n        }\n      "),
        })).to.be.deep.eq({
            id: 'shipment0',
            destination: 'Seattle',
            __typename: 'Shipment',
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlwbGVGcmFnbWVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtdWx0aXBsZUZyYWdtZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE4QjtBQUU5Qix3REFBdUQ7QUFDdkQscUVBQW9FO0FBQ3BFLGlEQUFvRTtBQUNwRSxvREFBd0Q7QUFFaEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLHNDQUFzQyxFQUFFO0lBRS9DLElBQUksTUFBYyxDQUFDO0lBQ25CLFNBQVMsQ0FBQztRQUNSLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLDJCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLE9BQU87WUFDWixHQUFDLFdBQVcsSUFBRztnQkFDYixJQUFJLHdCQUE4QztnQkFDbEQsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzNDLElBQUksRUFBRTtvQkFDSixTQUFTLEVBQUUsSUFBSTtpQkFDaEI7YUFDRjtZQUNELFNBQUssR0FBRTtnQkFDTCxJQUFJLHdCQUE4QztnQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRTthQUN2RDtZQUNELGVBQVcsR0FBRTtnQkFDWCxJQUFJLHdCQUE4QztnQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQzFDLElBQUksRUFBRTtvQkFDSixFQUFFLEVBQUUsV0FBVztvQkFDZixXQUFXLEVBQUUsU0FBUztvQkFDdEIsVUFBVSxFQUFFLFVBQVU7aUJBQ3ZCO2FBQ0Y7Z0JBQ0QsQ0FBQzs7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyx5REFBeUQsRUFBRTtRQUM1RCxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQztZQUN6QixFQUFFLEVBQUUsS0FBSztZQUNULFlBQVksRUFBRSxRQUFRO1lBQ3RCLFFBQVEsRUFBRSxxQkFBRyxDQUFDLCtOQVliLENBQUM7U0FDSCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDaEIsRUFBRSxFQUFFLEdBQUc7WUFDUCxJQUFJLEVBQUUsT0FBTztZQUNiLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLFFBQVEsRUFBRTtnQkFDUixFQUFFLEVBQUUsV0FBVztnQkFDZixXQUFXLEVBQUUsU0FBUztnQkFDdEIsVUFBVSxFQUFFLFVBQVU7YUFDdkI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQywyREFBMkQsRUFBRTtRQUM5RCxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQztZQUN6QixFQUFFLEVBQUUsV0FBVztZQUNmLFlBQVksRUFBRSxVQUFVO1lBQ3hCLFFBQVEsRUFBRSxxQkFBRyxDQUFDLHlNQVdiLENBQUM7U0FDSCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDaEIsRUFBRSxFQUFFLFdBQVc7WUFDZixXQUFXLEVBQUUsU0FBUztZQUN0QixVQUFVLEVBQUUsVUFBVTtTQUN2QixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=