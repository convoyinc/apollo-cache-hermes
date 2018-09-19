"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var EntitySnapshot_1 = require("../../../../src/nodes/EntitySnapshot");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("writeFragment directly to root query", function () {
    var hermes, baseline;
    beforeAll(function () {
        hermes = new Hermes_1.Hermes(new CacheContext_1.CacheContext(context_1.strictConfig));
        hermes.writeFragment({
            id: QueryRootId,
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          name\n          __typename\n        }\n      "),
            data: {
                id: 123,
                name: 'Gouda',
                __typename: 'Viewer',
            },
        });
        baseline = hermes.getCurrentCacheSnapshot().baseline;
    });
    it("correctly modify root query", function () {
        expect(baseline.getNodeSnapshot(QueryRootId)).to.deep.eq(new EntitySnapshot_1.EntitySnapshot({
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
        }, 
        /* inbound */ undefined, [{ id: '123', path: [] }]));
        expect(baseline.getNodeData(QueryRootId)).to.eq(baseline.getNodeData('123'));
    });
    it("correctly add new reference", function () {
        expect(baseline.getNodeSnapshot('123')).to.deep.eq(new EntitySnapshot_1.EntitySnapshot({
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
        }, [{ id: QueryRootId, path: [] }], 
        /* outbound */ undefined));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JpdGVSZWZlcmVuY2VUb1F1ZXJ5Um9vdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndyaXRlUmVmZXJlbmNlVG9RdWVyeVJvb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBOEI7QUFFOUIsd0RBQXVEO0FBQ3ZELHFFQUFvRTtBQUVwRSx1RUFBc0U7QUFDdEUsaURBQXNEO0FBQ3RELG9EQUF3RDtBQUVoRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsc0NBQXNDLEVBQUU7SUFFL0MsSUFBSSxNQUFjLEVBQUUsUUFBdUIsQ0FBQztJQUM1QyxTQUFTLENBQUM7UUFDUixNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSwyQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBQyxhQUFhLENBQUM7WUFDbkIsRUFBRSxFQUFFLFdBQVc7WUFDZixRQUFRLEVBQUUscUJBQUcsQ0FBQyw4R0FNYixDQUFDO1lBQ0YsSUFBSSxFQUFFO2dCQUNKLEVBQUUsRUFBRSxHQUFHO2dCQUNQLElBQUksRUFBRSxPQUFPO2dCQUNiLFVBQVUsRUFBRSxRQUFRO2FBQ3JCO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsUUFBUSxHQUFHLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLFFBQVEsQ0FBQztJQUN2RCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw2QkFBNkIsRUFBRTtRQUNoQyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUN0RCxJQUFJLCtCQUFjLENBQ2hCO1lBQ0UsRUFBRSxFQUFFLEdBQUc7WUFDUCxJQUFJLEVBQUUsT0FBTztZQUNiLFVBQVUsRUFBRSxRQUFRO1NBQ3JCO1FBQ0QsYUFBYSxDQUFDLFNBQVMsRUFDdkIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQzFCLENBQ0YsQ0FBQztRQUNGLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDL0UsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsNkJBQTZCLEVBQUU7UUFDaEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDaEQsSUFBSSwrQkFBYyxDQUNoQjtZQUNFLEVBQUUsRUFBRSxHQUFHO1lBQ1AsSUFBSSxFQUFFLE9BQU87WUFDYixVQUFVLEVBQUUsUUFBUTtTQUNyQixFQUNELENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUMvQixjQUFjLENBQUMsU0FBUyxDQUN6QixDQUNGLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=