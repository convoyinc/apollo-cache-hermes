"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("readFragment when no fragment is provided", function () {
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
                data: { id: 123, name: 'Gouda', __typename: 'Viewer' },
            },
            _a));
        var _a;
    });
    it("throws an error", function () {
        expect(function () {
            hermes.readFragment({
                id: '123',
                fragment: graphql_tag_1.default("\n          query viewer {\n            id\n            name\n          }\n        "),
            });
        }).to.throw(/No operations are allowed when using a fragment as a query/i);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JOb0ZyYWdtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXJyb3JOb0ZyYWdtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQThCO0FBRTlCLHdEQUF1RDtBQUN2RCxxRUFBb0U7QUFDcEUsaURBQW9FO0FBQ3BFLG9EQUF3RDtBQUVoRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsMkNBQTJDLEVBQUU7SUFFcEQsSUFBSSxNQUFjLENBQUM7SUFDbkIsU0FBUyxDQUFDO1FBQ1IsTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksMkJBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUMsQ0FBQztRQUNwRCxNQUFNLENBQUMsT0FBTztZQUNaLEdBQUMsV0FBVyxJQUFHO2dCQUNiLElBQUksd0JBQThDO2dCQUNsRCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDM0MsSUFBSSxFQUFFO29CQUNKLFNBQVMsRUFBRSxJQUFJO2lCQUNoQjthQUNGO1lBQ0QsU0FBSyxHQUFFO2dCQUNMLElBQUksd0JBQThDO2dCQUNsRCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUU7YUFDdkQ7Z0JBQ0QsQ0FBQzs7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxpQkFBaUIsRUFBRTtRQUNwQixNQUFNLENBQUM7WUFDTCxNQUFNLENBQUMsWUFBWSxDQUFDO2dCQUNsQixFQUFFLEVBQUUsS0FBSztnQkFDVCxRQUFRLEVBQUUscUJBQUcsQ0FBQyxxRkFLYixDQUFDO2FBQ0gsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyw2REFBNkQsQ0FBQyxDQUFDO0lBQzdFLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==