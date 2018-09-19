"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var SnapshotEditor_1 = require("../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("readFragment with parameterized values", function () {
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
                data: {
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
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          name\n          __typename\n          shipment(city: $city) {\n            __typename\n            truckType\n            complete\n            destination\n          }\n        }\n      "),
            variables: {
                city: 'Seattle',
            },
        })).to.be.deep.eq({
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
            shipment: {
                __typename: 'Shipment',
                destination: 'Seattle',
                complete: false,
                truckType: 'flat-bed',
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVyaXplZFZhbHVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGFyYW1ldGVyaXplZFZhbHVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQThCO0FBRTlCLHdEQUF1RDtBQUN2RCxxRUFBb0U7QUFDcEUsNEVBQXdGO0FBQ3hGLGlEQUFvRTtBQUNwRSxvREFBd0Q7QUFFaEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLHdDQUF3QyxFQUFFO0lBRWpELElBQUksTUFBYyxDQUFDO0lBQ25CLFNBQVMsQ0FBQztRQUNSLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLDJCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDLENBQUM7UUFDcEQsSUFBTSxlQUFlLEdBQUcsNENBQTJCLENBQ2pELEtBQUssRUFDTCxDQUFDLFVBQVUsQ0FBQyxFQUNaLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUNwQixDQUFDO1FBRUYsTUFBTSxDQUFDLE9BQU87WUFDWixHQUFDLFdBQVcsSUFBRztnQkFDYixJQUFJLHdCQUE4QztnQkFDbEQsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzNDLElBQUksRUFBRTtvQkFDSixTQUFTLEVBQUUsSUFBSTtpQkFDaEI7YUFDRjtZQUNELFNBQUssR0FBRTtnQkFDTCxJQUFJLHdCQUE4QztnQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxJQUFJLEVBQUU7b0JBQ0osRUFBRSxFQUFFLEdBQUc7b0JBQ1AsSUFBSSxFQUFFLE9BQU87b0JBQ2IsVUFBVSxFQUFFLFFBQVE7aUJBQ3JCO2FBQ0Y7WUFDRCxHQUFDLGVBQWUsSUFBRztnQkFDakIsSUFBSSxvQ0FBMEQ7Z0JBQzlELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLEVBQUU7b0JBQ0osVUFBVSxFQUFFLFVBQVU7b0JBQ3RCLFdBQVcsRUFBRSxTQUFTO29CQUN0QixRQUFRLEVBQUUsS0FBSztvQkFDZixTQUFTLEVBQUUsVUFBVTtpQkFDdEI7YUFDRjtnQkFDRCxDQUFDOztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDRCQUE0QixFQUFFO1FBQy9CLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO1lBQ3pCLEVBQUUsRUFBRSxLQUFLO1lBQ1QsUUFBUSxFQUFFLHFCQUFHLENBQUMsNFBBWWIsQ0FBQztZQUNGLFNBQVMsRUFBRTtnQkFDVCxJQUFJLEVBQUUsU0FBUzthQUNoQjtTQUNGLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNoQixFQUFFLEVBQUUsR0FBRztZQUNQLElBQUksRUFBRSxPQUFPO1lBQ2IsVUFBVSxFQUFFLFFBQVE7WUFDcEIsUUFBUSxFQUFFO2dCQUNSLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixXQUFXLEVBQUUsU0FBUztnQkFDdEIsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsU0FBUyxFQUFFLFVBQVU7YUFDdEI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=