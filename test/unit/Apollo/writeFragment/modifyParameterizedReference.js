"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var SnapshotEditor_1 = require("../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("writeFragment with parameterized references", function () {
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
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          shipment(city: $city) {\n            id\n            complete\n            truckType\n          }\n        }\n      "),
            variables: {
                city: 'Seattle',
            },
            data: {
                id: 123,
                shipment: {
                    id: 'shipment0',
                    complete: true,
                    truckType: 'flatbed',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kaWZ5UGFyYW1ldGVyaXplZFJlZmVyZW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZGlmeVBhcmFtZXRlcml6ZWRSZWZlcmVuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBOEI7QUFFOUIsd0RBQXVEO0FBQ3ZELHFFQUFvRTtBQUVwRSw0RUFBd0Y7QUFDeEYsaURBQW9FO0FBQ3BFLG9EQUF3RDtBQUVoRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsNkNBQTZDLEVBQUU7SUFFdEQsSUFBTSxlQUFlLEdBQUcsNENBQTJCLENBQ2pELEtBQUssRUFDTCxDQUFDLFVBQVUsQ0FBQyxFQUNaLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUNwQixDQUFDO0lBRUYsSUFBSSxNQUFjLEVBQUUsUUFBdUIsQ0FBQztJQUM1QyxTQUFTLENBQUM7UUFDUixNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSwyQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBQyxPQUFPO1lBQ1osR0FBQyxXQUFXLElBQUc7Z0JBQ2IsSUFBSSx3QkFBOEM7Z0JBQ2xELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLEVBQUU7b0JBQ0osU0FBUyxFQUFFLElBQUk7aUJBQ2hCO2FBQ0Y7WUFDRCxTQUFLLEdBQUU7Z0JBQ0wsSUFBSSx3QkFBOEM7Z0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDdkQsSUFBSSxFQUFFO29CQUNKLEVBQUUs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