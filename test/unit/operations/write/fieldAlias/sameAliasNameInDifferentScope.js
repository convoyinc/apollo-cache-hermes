"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var write_1 = require("../../../../../src/operations/write");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe("operations.write", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    describe("same alias name in different scope", function () {
        var aliasQuery, snapshot;
        beforeAll(function () {
            aliasQuery = helpers_1.query("{\n        shipment: Shipment {\n          id: shipmentId,\n          name: shipmentName,\n        }\n        dispatch: Dispatcher {\n          id\n          name\n        }\n        carrier: Carrier {\n          id: carrierId\n          name: carrierName\n        }\n      }");
            snapshot = write_1.write(context, empty, aliasQuery, {
                shipment: {
                    id: 0,
                    name: 'ToSeattle',
                },
                dispatch: {
                    id: 2,
                    name: 'Bob The dispatcher',
                },
                carrier: {
                    id: 1,
                    name: 'Bob',
                },
            }).snapshot;
        });
        it("only writes fields from the schema", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                Shipment: {
                    shipmentId: 0,
                    shipmentName: 'ToSeattle',
                },
                Dispatcher: {
                    id: 2,
                    name: 'Bob The dispatcher',
                },
                Carrier: {
                    carrierId: 1,
                    carrierName: 'Bob',
                },
            });
        });
        it("checks shape of GraphNodeSnapshot", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId)).to.deep.eq({
                inbound: undefined,
                outbound: [{ id: '0', path: ['Shipment'] }, { id: '2', path: ['Dispatcher'] }, { id: '1', path: ['Carrier'] }],
                data: {
                    Shipment: {
                        shipmentId: 0,
                        shipmentName: 'ToSeattle',
                    },
                    Dispatcher: {
                        id: 2,
                        name: 'Bob The dispatcher',
                    },
                    Carrier: {
                        carrierId: 1,
                        carrierName: 'Bob',
                    },
                },
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FtZUFsaWFzTmFtZUluRGlmZmVyZW50U2NvcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzYW1lQWxpYXNOYW1lSW5EaWZmZXJlbnRTY29wZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsNkRBQTREO0FBQzVELG9EQUF1RTtBQUN2RSwrQ0FBMEQ7QUFFbEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBRWxDLFFBQVEsQ0FBQyxvQ0FBb0MsRUFBRTtRQUU3QyxJQUFJLFVBQXdCLEVBQUUsUUFBdUIsQ0FBQztRQUN0RCxTQUFTLENBQUM7WUFDUixVQUFVLEdBQUcsZUFBSyxDQUFDLHFSQWFqQixDQUFDLENBQUM7WUFFSixRQUFRLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFO2dCQUMzQyxRQUFRLEVBQUU7b0JBQ1IsRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLFdBQVc7aUJBQ2xCO2dCQUNELFFBQVEsRUFBRTtvQkFDUixFQUFFLEVBQUUsQ0FBQztvQkFDTCxJQUFJLEVBQUUsb0JBQW9CO2lCQUMzQjtnQkFDRCxPQUFPLEVBQUU7b0JBQ1AsRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLEtBQUs7aUJBQ1o7YUFDRixDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsb0NBQW9DLEVBQUU7WUFDdkMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsUUFBUSxFQUFFO29CQUNSLFVBQVUsRUFBRSxDQUFDO29CQUNiLFlBQVksRUFBRSxXQUFXO2lCQUMxQjtnQkFDRCxVQUFVLEVBQUU7b0JBQ1YsRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLG9CQUFvQjtpQkFDM0I7Z0JBQ0QsT0FBTyxFQUFFO29CQUNQLFNBQVMsRUFBRSxDQUFDO29CQUNaLFdBQVcsRUFBRSxLQUFLO2lCQUNuQjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG1DQUFtQyxFQUFFO1lBQ3RDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELE9BQU8sRUFBRSxTQUFTO2dCQUNsQixRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDOUcsSUFBSSxFQUFFO29CQUNKLFFBQVEsRUFBRTt3QkFDUixVQUFVLEVBQUUsQ0FBQzt3QkFDYixZQUFZLEVBQUUsV0FBVztxQkFDMUI7b0JBQ0QsVUFBVSxFQUFFO3dCQUNWLEVBQUUsRUFBRSxDQUFDO3dCQUNMLElBQUksRUFBRSxvQkFBb0I7cUJBQzNCO29CQUNELE9BQU8sRUFBRTt3QkFDUCxTQUFTLEVBQUUsQ0FBQzt3QkFDWixXQUFXLEVBQUUsS0FBSztxQkFDbkI7aUJBQ0Y7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==