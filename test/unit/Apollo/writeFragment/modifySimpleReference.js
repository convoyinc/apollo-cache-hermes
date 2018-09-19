"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var EntitySnapshot_1 = require("../../../../src/nodes/EntitySnapshot");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("writeFragment with simple reference", function () {
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
                data: { id: 123, name: 'Gouda', __typename: 'Viewer' },
            },
            _a));
        hermes.writeFragment({
            id: '123',
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          name\n          notes {\n            details\n          }\n        }\n      "),
            data: {
                id: 123,
                name: 'Munster',
                __typename: 'Viewer',
                notes: [
                    {
                        details: 'Hello',
                    },
                    {
                        details: 'World',
                    },
                ],
            },
        });
        baseline = hermes.getCurrentCacheSnapshot().baseline;
        var _a;
    });
    it("correctly modify data on the reference", function () {
        expect(baseline.getNodeData('123')).to.deep.eq({
            id: 123,
            name: 'Munster',
            __typename: 'Viewer',
            notes: [
                {
                    details: 'Hello',
                },
                {
                    details: 'World',
                },
            ],
        });
    });
    it("correctly reference from root node", function () {
        expect(baseline.getNodeSnapshot('123')).to.deep.eq(new EntitySnapshot_1.EntitySnapshot({
            id: 123,
            name: 'Munster',
            __typename: 'Viewer',
            notes: [
                {
                    details: 'Hello',
                },
                {
                    details: 'World',
                },
            ],
        }, [{ id: QueryRootId, path: ['viewer'] }]));
        expect(baseline.getNodeData(QueryRootId)['viewer']).to.eq(baseline.getNodeData('123'));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kaWZ5U2ltcGxlUmVmZXJlbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kaWZ5U2ltcGxlUmVmZXJlbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQThCO0FBRTlCLHdEQUF1RDtBQUN2RCxxRUFBb0U7QUFFcEUsdUVBQXNFO0FBQ3RFLGlEQUFvRTtBQUNwRSxvREFBd0Q7QUFFaEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLHFDQUFxQyxFQUFFO0lBRTlDLElBQUksTUFBYyxFQUFFLFFBQXVCLENBQUM7SUFDNUMsU0FBUyxDQUFDO1FBQ1IsTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksMkJBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUMsQ0FBQztRQUNwRCxNQUFNLENBQUMsT0FBTztZQUNaLEdBQUMsV0FBVyxJQUFHO2dCQUNiLElBQUksd0JBQThDO2dCQUNsRCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDM0MsSUFBSSxFQUFFO29CQUNKLFNBQVMsRUFBRSxJQUFJO2lCQUNoQjthQUNGO1lBQ0QsU0FBSyxHQUFFO2dCQUNMLElBQUksd0JBQThDO2dCQUNsRCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUU7YUFDdkQ7Z0JBQ0QsQ0FBQztRQUVILE1BQU0sQ0FBQyxhQUFhLENBQUM7WUFDbkIsRUFBRSxFQUFFLEtBQUs7WUFDVCxRQUFRLEVBQUUscUJBQUcsQ0FBQyw2SUFRYixDQUFDO1lBQ0YsSUFBSSxFQUFFO2dCQUNKLEVBQUUsRUFBRSxHQUFHO2dCQUNQLElBQUksRUFBRSxTQUFTO2dCQUNmLFVBQVUsRUFBRSxRQUFRO2dCQUNwQixLQUFLLEVBQUU7b0JBQ0w7d0JBQ0UsT0FBTyxFQUFFLE9BQU87cUJBQ2pCO29CQUNEO3dCQUNFLE9BQU8sRUFBRSxPQUFPO3FCQUNqQjtpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsUUFBUSxHQUFHLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLFFBQVEsQ0FBQzs7SUFDdkQsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsd0NBQXdDLEVBQUU7UUFDM0MsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUM3QyxFQUFFLEVBQUUsR0FBRztZQUNQLElBQUksRUFBRSxTQUFTO1lBQ2YsVUFBVSxFQUFFLFFBQVE7WUFDcEIsS0FBSyxFQUFFO2dCQUNMO29CQUNFLE9BQU8sRUFBRSxPQUFPO2lCQUNqQjtnQkFDRDtvQkFDRSxPQUFPLEVBQUUsT0FBTztpQkFDakI7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFO1FBQ3ZDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ2hELElBQUksK0JBQWMsQ0FDaEI7WUFDRSxFQUFFLEVBQUUsR0FBRztZQUNQLElBQUksRUFBRSxTQUFTO1lBQ2YsVUFBVSxFQUFFLFFBQVE7WUFDcEIsS0FBSyxFQUFFO2dCQUNMO29CQUNFLE9BQU8sRUFBRSxPQUFPO2lCQUNqQjtnQkFDRDtvQkFDRSxPQUFPLEVBQUUsT0FBTztpQkFDakI7YUFDRjtTQUNGLEVBQ0QsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUN4QyxDQUNGLENBQUM7UUFDRixNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzFGLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==