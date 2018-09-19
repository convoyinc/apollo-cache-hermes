"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var SnapshotEditor_1 = require("../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("readFragment with parameterized references", function () {
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
    it("returns parameterized data", function () {
        expect(hermes.readFragment({
            id: '123',
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          __typename\n          name\n          shipment(city: $city) {\n            id\n            __typename\n            truckType\n            complete\n            destination\n          }\n        }\n      "),
            variables: {
                city: 'Seattle',
            },
        })).to.be.deep.eq({
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
            shipment: {
                id: 'shipment0',
                __typename: 'Shipment',
                destination: 'Seattle',
                complete: false,
                truckType: 'flat-bed',
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVyaXplZFJlZmVyZW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBhcmFtZXRlcml6ZWRSZWZlcmVuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBOEI7QUFFOUIsd0RBQXVEO0FBQ3ZELHFFQUFvRTtBQUNwRSw0RUFBd0Y7QUFDeEYsaURBQW9FO0FBQ3BFLG9EQUF3RDtBQUVoRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsNENBQTRDLEVBQUU7SUFFckQsSUFBSSxNQUFjLENBQUM7SUFDbkIsU0FBUyxDQUFDO1FBQ1IsTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksMkJBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUMsQ0FBQztRQUNwRCxJQUFNLGVBQWUsR0FBRyw0Q0FBMkIsQ0FDakQsS0FBSyxFQUNMLENBQUMsVUFBVSxDQUFDLEVBQ1osRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQ3BCLENBQUM7UUFFRixNQUFNLENBQUMsT0FBTztZQUNaLEdBQUMsV0FBVyxJQUFHO2dCQUNiLElBQUksd0JBQThDO2dCQUNsRCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDM0MsSUFBSSxFQUFFO29CQUNKLFNBQVMsRUFBRSxJQUFJO2lCQUNoQjthQUNGO1lBQ0QsU0FBSyxHQUFFO2dCQUNMLElBQUksd0JBQThDO2dCQUNsRCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELElBQUksRUFBRTtvQkFDSixFQUFFLEVBQUUsR0FBRztvQkFDUCxJQUFJLEVBQUUsT0FBTztvQkFDYixVQUFVLEVBQUUsUUFBUTtpQkFDckI7YUFDRjtZQUNELEdBQUMsZUFBZSxJQUFHO2dCQUNqQixJQUFJLG9DQUEwRDtnQkFDOUQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQzVDLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLElBQUksRUFBRSxJQUFJO2FBQ1g7WUFDRCxlQUFXLEdBQUU7Z0JBQ1gsSUFBSSx3QkFBOEM7Z0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLEVBQUU7b0JBQ0osRUFBRSxFQUFFLFdBQVc7b0JBQ2YsVUFBVSxFQUFFLFVBQVU7b0JBQ3RCLFdBQVcsRUFBRSxTQUFTO29CQUN0QixRQUFRLEVBQUUsS0FBSztvQkFDZixTQUFTLEVBQUUsVUFBVTtpQkFDdEI7YUFDRjtnQkFDRCxDQUFDOztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDRCQUE0QixFQUFFO1FBQy9CLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO1lBQ3pCLEVBQUUsRUFBRSxLQUFLO1lBQ1QsUUFBUSxFQUFFLHFCQUFHLENBQUMsNFFBYWIsQ0FBQztZQUNGLFNBQVMsRUFBRTtnQkFDVCxJQUFJLEVBQUUsU0FBUzthQUNoQjtTQUNGLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNoQixFQUFFLEVBQUUsR0FBRztZQUNQLElBQUksRUFBRSxPQUFPO1lBQ2IsVUFBVSxFQUFFLFFBQVE7WUFDcEIsUUFBUSxFQUFFO2dCQUNSLEVBQUUsRUFBRSxXQUFXO2dCQUNmLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixXQUFXLEVBQUUsU0FBUztnQkFDdEIsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsU0FBUyxFQUFFLFVBQVU7YUFDdEI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=