"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var EntitySnapshot_1 = require("../../../../src/nodes/EntitySnapshot");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("writeFragment", function () {
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
                data: {
                    id: 123,
                    name: 'Gouda',
                    __typename: 'Viewer',
                },
            },
            _a));
        hermes.writeFragment({
            id: '123',
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          shipment {\n            id\n            city\n            __typename\n          }\n        }\n      "),
            data: {
                id: 123,
                shipment: {
                    id: 'shipment0',
                    city: 'Seattle',
                    __typename: 'Shipment',
                },
            },
        });
        var _a;
    });
    it("adds references", function () {
        expect(hermes.getCurrentCacheSnapshot().baseline.getNodeData('shipment0')).to.deep.eq({
            id: 'shipment0',
            city: 'Seattle',
            __typename: 'Shipment',
        });
    });
    it("inlines referenced data into referencing entities", function () {
        var baseline = hermes.getCurrentCacheSnapshot().baseline;
        expect(baseline.getNodeSnapshot('123')).to.deep.eq(new EntitySnapshot_1.EntitySnapshot({
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
            shipment: {
                id: 'shipment0',
                city: 'Seattle',
                __typename: 'Shipment',
            },
        }, [{ id: QueryRootId, path: ['viewer'] }], [{ id: 'shipment0', path: ['shipment'] }]));
        expect(baseline.getNodeData('123')['shipment']).to.eq(baseline.getNodeData('shipment0'));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkUmVmZXJlbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWRkUmVmZXJlbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQThCO0FBRTlCLHdEQUF1RDtBQUN2RCxxRUFBb0U7QUFDcEUsdUVBQXNFO0FBQ3RFLGlEQUFvRTtBQUNwRSxvREFBd0Q7QUFFaEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLGVBQWUsRUFBRTtJQUV4QixJQUFJLE1BQWMsQ0FBQztJQUVuQixTQUFTLENBQUM7UUFDUixNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSwyQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBQyxPQUFPO1lBQ1osR0FBQyxXQUFXLElBQUc7Z0JBQ2IsSUFBSSx3QkFBOEM7Z0JBQ2xELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLEVBQUU7b0JBQ0osU0FBUyxFQUFFLElBQUk7aUJBQ2hCO2FBQ0Y7WUFDRCxTQUFLLEdBQUU7Z0JBQ0wsSUFBSSx3QkFBOEM7Z0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLEVBQUU7b0JBQ0osRUFBRSxFQUFFLEdBQUc7b0JBQ1AsSUFBSSxFQUFFLE9BQU87b0JBQ2IsVUFBVSxFQUFFLFFBQVE7aUJBQ3JCO2FBQ0Y7Z0JBQ0QsQ0FBQztRQUVILE1BQU0sQ0FBQyxhQUFhLENBQUM7WUFDbkIsRUFBRSxFQUFFLEtBQUs7WUFDVCxRQUFRLEVBQUUscUJBQUcsQ0FBQyxxS0FTYixDQUFDO1lBQ0YsSUFBSSxFQUFFO2dCQUNKLEVBQUUsRUFBRSxHQUFHO2dCQUNQLFFBQVEsRUFBRTtvQkFDUixFQUFFLEVBQUUsV0FBVztvQkFDZixJQUFJLEVBQUUsU0FBUztvQkFDZixVQUFVLEVBQUUsVUFBVTtpQkFDdkI7YUFDRjtTQUNGLENBQUMsQ0FBQzs7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxpQkFBaUIsRUFBRTtRQUNwQixNQUFNLENBQUMsTUFBTSxDQUFDLHVCQUF1QixFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3BGLEVBQUUsRUFBRSxXQUFXO1lBQ2YsSUFBSSxFQUFFLFNBQVM7WUFDZixVQUFVLEVBQUUsVUFBVTtTQUN2QixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxtREFBbUQsRUFBRTtRQUN0RCxJQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxRQUFRLENBQUM7UUFDM0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDaEQsSUFBSSwrQkFBYyxDQUNoQjtZQUNFLEVBQUUsRUFBRSxHQUFHO1lBQ1AsSUFBSSxFQUFFLE9BQU87WUFDYixVQUFVLEVBQUUsUUFBUTtZQUNwQixRQUFRLEVBQUU7Z0JBQ1IsRUFBRSxFQUFFLFdBQVc7Z0JBQ2YsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsVUFBVSxFQUFFLFVBQVU7YUFDdkI7U0FDRixFQUNELENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFDdkMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUMxQyxDQUNGLENBQUM7UUFFRixNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQzVGLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==