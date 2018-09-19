"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("writeFragment and then readFragment", function () {
    var hermes;
    var readWriteFragment = graphql_tag_1.default("\n    fragment viewer on Viewer {\n      id\n      name\n    }\n    fragment shipment on Shipment {\n      id\n      complete\n      date\n    }\n  ");
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
                    name: 'Gouda',
                    __typename: 'Viewer',
                },
            },
            _a['shipment0'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: '123', path: ['shipment'] }],
                data: {
                    id: 'shipment0',
                    complete: false,
                    city: 'Seattle',
                    distance: 100,
                    __typename: 'Shipment',
                },
            },
            _a));
        var _a;
    });
    it("write then read with same fragment", function () {
        hermes.writeFragment({
            id: '123',
            fragmentName: 'viewer',
            fragment: readWriteFragment,
            data: {
                id: 123,
                name: 'Munster',
            },
        });
        expect(hermes.readFragment({
            id: '123',
            fragmentName: 'viewer',
            fragment: readWriteFragment,
        })).to.deep.eq({
            id: 123,
            name: 'Munster',
            __typename: 'Viewer',
            shipment: {
                id: 'shipment0',
                complete: false,
                city: 'Seattle',
                distance: 100,
                __typename: 'Shipment',
            },
        });
    });
    it("update nested reference but read with another fragment", function () {
        hermes.writeFragment({
            id: 'shipment0',
            fragmentName: 'shipment',
            fragment: readWriteFragment,
            data: {
                id: 'shipment0',
                complete: true,
                date: '11/11/17',
            },
        });
        expect(hermes.readFragment({
            id: '123',
            fragmentName: 'viewer',
            fragment: readWriteFragment,
        })).to.deep.eq({
            id: 123,
            name: 'Munster',
            __typename: 'Viewer',
            shipment: {
                id: 'shipment0',
                complete: true,
                date: '11/11/17',
                city: 'Seattle',
                distance: 100,
                __typename: 'Shipment',
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JpdGVUaGVuUmVhZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndyaXRlVGhlblJlYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBOEI7QUFFOUIsd0RBQXVEO0FBQ3ZELHFFQUFvRTtBQUNwRSxpREFBb0U7QUFDcEUsb0RBQXdEO0FBRWhELElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxxQ0FBcUMsRUFBRTtJQUU5QyxJQUFJLE1BQWMsQ0FBQztJQUNuQixJQUFNLGlCQUFpQixHQUFHLHFCQUFHLENBQUMsc0pBVTdCLENBQUMsQ0FBQztJQUVILFNBQVMsQ0FBQztRQUNSLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLDJCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLE9BQU87WUFDWixHQUFDLFdBQVcsSUFBRztnQkFDYixJQUFJLHdCQUE4QztnQkFDbEQsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzNDLElBQUksRUFBRTtvQkFDSixTQUFTLEVBQUUsSUFBSTtpQkFDaEI7YUFDRjtZQUNELFNBQUssR0FBRTtnQkFDTCxJQUFJLHdCQUE4QztnQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxJQUFJLEVBQUU7b0JBQ0osRUFBRSxFQUFFLEdBQUc7b0JBQ1AsSUFBSSxFQUFFLE9BQU87b0JBQ2IsVUFBVSxFQUFFLFFBQVE7aUJBQ3JCO2FBQ0Y7WUFDRCxlQUFXLEdBQUU7Z0JBQ1gsSUFBSSx3QkFBOEM7Z0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLEVBQUU7b0JBQ0osRUFBRSxFQUFFLFdBQVc7b0JBQ2YsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsUUFBUSxFQUFFLEdBQUc7b0JBQ2IsVUFBVSxFQUFFLFVBQVU7aUJBQ3ZCO2FBQ0Y7Z0JBQ0QsQ0FBQzs7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtRQUN2QyxNQUFNLENBQUMsYUFBYSxDQUFDO1lBQ25CLEVBQUUsRUFBRSxLQUFLO1lBQ1QsWUFBWSxFQUFFLFFBQVE7WUFDdEIsUUFBUSxFQUFFLGlCQUFpQjtZQUMzQixJQUFJLEVBQUU7Z0JBQ0osRUFBRSxFQUFFLEdBQUc7Z0JBQ1AsSUFBSSxFQUFFLFNBQVM7YUFDaEI7U0FDRixDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQztZQUN6QixFQUFFLEVBQUUsS0FBSztZQUNULFlBQVksRUFBRSxRQUFRO1lBQ3RCLFFBQVEsRUFBRSxpQkFBaUI7U0FDNUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDYixFQUFFLEVBQUUsR0FBRztZQUNQLElBQUksRUFBRSxTQUFTO1lBQ2YsVUFBVSxFQUFFLFFBQVE7WUFDcEIsUUFBUSxFQUFFO2dCQUNSLEVBQUUsRUFBRSxXQUFXO2dCQUNmLFFBQVEsRUFBRSxLQUFLO2dCQUNmLElBQUksRUFBRSxTQUFTO2dCQUNmLFFBQVEsRUFBRSxHQUFHO2dCQUNiLFVBQVUsRUFBRSxVQUFVO2FBQ3ZCO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsd0RBQXdELEVBQUU7UUFDM0QsTUFBTSxDQUFDLGFBQWEsQ0FBQztZQUNuQixFQUFFLEVBQUUsV0FBVztZQUNmLFlBQVksRUFBRSxVQUFVO1lBQ3hCLFFBQVEsRUFBRSxpQkFBaUI7WUFDM0IsSUFBSSxFQUFFO2dCQUNKLEVBQUUsRUFBRSxXQUFXO2dCQUNmLFFBQVEsRUFBRSxJQUFJO2dCQUNkLElBQUksRUFBRSxVQUFVO2FBQ2pCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7WUFDekIsRUFBRSxFQUFFLEtBQUs7WUFDVCxZQUFZLEVBQUUsUUFBUTtZQUN0QixRQUFRLEVBQUUsaUJBQWlCO1NBQzVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2IsRUFBRSxFQUFFLEdBQUc7WUFDUCxJQUFJLEVBQUUsU0FBUztZQUNmLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLFFBQVEsRUFBRTtnQkFDUixFQUFFLEVBQUUsV0FBVztnQkFDZixRQUFRLEVBQUUsSUFBSTtnQkFDZCxJQUFJLEVBQUUsVUFBVTtnQkFDaEIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsUUFBUSxFQUFFLEdBQUc7Z0JBQ2IsVUFBVSxFQUFFLFVBQVU7YUFDdkI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=