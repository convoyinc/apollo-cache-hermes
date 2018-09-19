"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var SnapshotEditor_1 = require("../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("readFragment with alias references", function () {
    var hermes;
    beforeAll(function () {
        hermes = new Hermes_1.Hermes(new CacheContext_1.CacheContext(context_1.strictConfig));
        var parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue('123', ['shipment'], { city: 'Seattle' });
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
                outbound: [{ id: parameterizedId, path: ['shipment'] }],
                data: {
                    id: 123,
                    name: 'Gouda',
                    __typename: 'Viewer',
                },
            },
            _a[parameterizedId] = {
                type: 1 /* ParameterizedValueSnapshot */,
                inbound: [{ id: '123', path: ['shipment'] }],
                outbound: [{ id: 'shipment0', path: [] }],
                data: null,
            },
            _a['shipment0'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: [parameterizedId], path: [] }],
                data: {
                    id: 'shipment0',
                    __typename: 'Shipment',
                    destination: 'Seattle',
                    complete: false,
                    truckType: 'flat-bed',
                },
            },
            _a));
        var _a;
    });
    it("correctly read a fragment with parameterized reference", function () {
        expect(hermes.readFragment({
            id: '123',
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          __typename\n          fullName: name\n          shipmentInfo: shipment(city: $city) {\n            id\n            __typename\n            truckType\n            isCompleted: complete\n            destination\n          }\n        }\n      "),
            variables: {
                city: 'Seattle',
            },
        })).to.be.deep.eq({
            id: 123,
            fullName: 'Gouda',
            name: 'Gouda',
            __typename: 'Viewer',
            shipmentInfo: {
                id: 'shipment0',
                __typename: 'Shipment',
                destination: 'Seattle',
                isCompleted: false,
                complete: false,
                truckType: 'flat-bed',
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXNSZWZlcmVuY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhbGlhc1JlZmVyZW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE4QjtBQUU5Qix3REFBdUQ7QUFDdkQscUVBQW9FO0FBQ3BFLDRFQUF3RjtBQUN4RixpREFBb0U7QUFDcEUsb0RBQXdEO0FBRWhELElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxvQ0FBb0MsRUFBRTtJQUU3QyxJQUFJLE1BQWMsQ0FBQztJQUNuQixTQUFTLENBQUM7UUFDUixNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSwyQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQU0sZUFBZSxHQUFHLDRDQUEyQixDQUNqRCxLQUFLLEVBQ0wsQ0FBQyxVQUFVLENBQUMsRUFDWixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FDcEIsQ0FBQztRQUVGLE1BQU0sQ0FBQyxPQUFPO1lBQ1osR0FBQyxXQUFXLElBQUc7Z0JBQ2IsSUFBSSx3QkFBOEM7Z0JBQ2xELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLEVBQUU7b0JBQ0osU0FBUyxFQUFFLElBQUk7aUJBQ2hCO2FBQ0Y7WUFDRCxTQUFLLEdBQUU7Z0JBQ0wsSUFBSSx3QkFBOEM7Z0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDdkQsSUFBSSxFQUFFO29CQUNKLEVBQUUsRUFBRSxHQUFHO29CQUNQLElBQUksRUFBRSxPQUFPO29CQUNiLFVBQVUsRUFBRSxRQUFRO2lCQUNyQjthQUNGO1lBQ0QsR0FBQyxlQUFlLElBQUc7Z0JBQ2pCLElBQUksb0NBQTBEO2dCQUM5RCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDNUMsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxFQUFFLElBQUk7YUFDWDtZQUNELGVBQVcsR0FBRTtnQkFDWCxJQUFJLHdCQUE4QztnQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQzlDLElBQUksRUFBRTtvQkFDSixFQUFFLEVBQUUsV0FBVztvQkFDZixVQUFVLEVBQUUsVUFBVTtvQkFDdEIsV0FBVyxFQUFFLFNBQVM7b0JBQ3RCLFFBQVEsRUFBRSxLQUFLO29CQUNmLFNBQVMsRUFBRSxVQUFVO2lCQUN0QjthQUNGO2dCQUNELENBQUM7O0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsd0RBQXdELEVBQUU7UUFDM0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7WUFDekIsRUFBRSxFQUFFLEtBQUs7WUFDVCxRQUFRLEVBQUUscUJBQUcsQ0FBQyxpVEFhYixDQUFDO1lBQ0YsU0FBUyxFQUFFO2dCQUNULElBQUksRUFBRSxTQUFTO2FBQ2hCO1NBQ0YsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2hCLEVBQUUsRUFBRSxHQUFHO1lBQ1AsUUFBUSxFQUFFLE9BQU87WUFDakIsSUFBSSxFQUFFLE9BQU87WUFDYixVQUFVLEVBQUUsUUFBUTtZQUNwQixZQUFZLEVBQUU7Z0JBQ1osRUFBRSxFQUFFLFdBQVc7Z0JBQ2YsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLFdBQVcsRUFBRSxTQUFTO2dCQUN0QixXQUFXLEVBQUUsS0FBSztnQkFDbEIsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsU0FBUyxFQUFFLFVBQVU7YUFDdEI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=