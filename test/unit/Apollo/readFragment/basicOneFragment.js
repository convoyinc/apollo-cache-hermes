"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("readFragment with one fragment", function () {
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
    it("correctly read a fragment", function () {
        expect(hermes.readFragment({
            id: '123',
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          name\n        }\n      "),
        })).to.be.deep.eq({
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzaWNPbmVGcmFnbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhc2ljT25lRnJhZ21lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBOEI7QUFFOUIsd0RBQXVEO0FBQ3ZELHFFQUFvRTtBQUNwRSxpREFBb0U7QUFDcEUsb0RBQXdEO0FBRWhELElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxnQ0FBZ0MsRUFBRTtJQUV6QyxJQUFJLE1BQWMsQ0FBQztJQUNuQixTQUFTLENBQUM7UUFDUixNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSwyQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBQyxPQUFPO1lBQ1osR0FBQyxXQUFXLElBQUc7Z0JBQ2IsSUFBSSx3QkFBOEM7Z0JBQ2xELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLEVBQUU7b0JBQ0osU0FBUyxFQUFFLElBQUk7aUJBQ2hCO2FBQ0Y7WUFDRCxTQUFLLEdBQUU7Z0JBQ0wsSUFBSSx3QkFBOEM7Z0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRTthQUN2RDtnQkFDRCxDQUFDOztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDJCQUEyQixFQUFFO1FBQzlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO1lBQ3pCLEVBQUUsRUFBRSxLQUFLO1lBQ1QsUUFBUSxFQUFFLHFCQUFHLENBQUMsd0ZBS2IsQ0FBQztTQUNILENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNoQixFQUFFLEVBQUUsR0FBRztZQUNQLElBQUksRUFBRSxPQUFPO1lBQ2IsVUFBVSxFQUFFLFFBQVE7U0FDckIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9