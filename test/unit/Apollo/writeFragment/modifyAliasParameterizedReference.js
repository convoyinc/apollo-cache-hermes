"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var SnapshotEditor_1 = require("../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("writeFragment with alias paramterized references", function () {
    var parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue('123', ['shipment'], { city: 'Seattle' });
    var hermes, baseline;
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
                    destination: 'Seattle',
                    complete: false,
                    truckType: 'flat-bed',
                },
            },
            _a));
        hermes.writeFragment({
            id: '123',
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          shipmentInfo: shipment(city: $city) {\n            id\n            complete\n            truck: truckType\n          }\n        }\n      "),
            variables: {
                city: 'Seattle',
            },
            data: {
                id: 123,
                shipmentInfo: {
                    id: 'shipment0',
                    complete: true,
                    truck: 'flatbed',
                },
            },
        });
        baseline = hermes.getCurrentCacheSnapshot().baseline;
        var _a;
    });
    it("correctly modify data", function () {
        expect(baseline.getNodeData('shipment0')).to.deep.eq({
            complete: true,
            truckType: 'flatbed',
            id: 'shipment0',
            destination: 'Seattle',
        });
    });
    it("correctly references a parameterized reference", function () {
        expect(baseline.getNodeSnapshot(parameterizedId)).to.deep.eq({
            outbound: [{ id: 'shipment0', path: [] }],
            inbound: [{ id: '123', path: ['shipment'] }],
            data: {
                complete: true,
                truckType: 'flatbed',
                id: 'shipment0',
                destination: 'Seattle',
            },
        });
        expect(baseline.getNodeData(parameterizedId)).to.eq(baseline.getNodeData('shipment0'));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kaWZ5QWxpYXNQYXJhbWV0ZXJpemVkUmVmZXJlbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kaWZ5QWxpYXNQYXJhbWV0ZXJpemVkUmVmZXJlbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQThCO0FBRTlCLHdEQUF1RDtBQUN2RCxxRUFBb0U7QUFFcEUsNEVBQXdGO0FBQ3hGLGlEQUFvRTtBQUNwRSxvREFBd0Q7QUFFaEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLGtEQUFrRCxFQUFFO0lBRTNELElBQU0sZUFBZSxHQUFHLDRDQUEyQixDQUNqRCxLQUFLLEVBQ0wsQ0FBQyxVQUFVLENBQUMsRUFDWixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FDcEIsQ0FBQztJQUVGLElBQUksTUFBYyxFQUFFLFFBQXVCLENBQUM7SUFDNUMsU0FBUyxDQUFDO1FBQ1IsTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksMkJBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUMsQ0FBQztRQUNwRCxNQUFNLENBQUMsT0FBTztZQUNaLEdBQUMsV0FBVyxJQUFHO2dCQUNiLElBQUksd0JBQThDO2dCQUNsRCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDM0MsSUFBSSxFQUFFO29CQUNKLFNBQVMsRUFBRSxJQUFJO2lCQUNoQjthQUNGO1lBQ0QsU0FBSyxHQUFFO2dCQUNMLElBQUksd0JBQThDO2dCQUNsRCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELElBQUksRUFBRTtv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