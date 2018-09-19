"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../../../../../src/nodes");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe("operations.write", function () {
    describe("nested values hanging off of a root", function () {
        var snapshot, editedNodeIds;
        beforeAll(function () {
            var result = helpers_1.createSnapshot({
                bar: {
                    value: 42,
                    prop1: 'hello',
                    prop2: {
                        nestedProp1: 1000,
                        nestedProp2: 'world',
                    },
                },
            }, "{\n          bar {\n            value\n            prop1\n            prop2\n          }\n        }");
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("creates the query root, with the values", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                bar: {
                    value: 42,
                    prop1: 'hello',
                    prop2: {
                        nestedProp1: 1000,
                        nestedProp2: 'world',
                    },
                },
            });
        });
        it("marks the root as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
        });
        it("only contains the root node", function () {
            expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
        });
        it("emits the root as an EntitySnapshot", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkVmFsdWVzT2ZmQVJvb3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXN0ZWRWYWx1ZXNPZmZBUm9vdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLGtEQUEwRDtBQUMxRCxvREFBaUU7QUFDakUsK0NBQXFEO0FBRTdDLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELGdGQUFnRjtBQUNoRixFQUFFO0FBQ0YsNkVBQTZFO0FBQzdFLGdGQUFnRjtBQUNoRixRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFDM0IsUUFBUSxDQUFDLHFDQUFxQyxFQUFFO1FBRTlDLElBQUksUUFBdUIsRUFBRSxhQUEwQixDQUFDO1FBQ3hELFNBQVMsQ0FBQztZQUNSLElBQU0sTUFBTSxHQUFHLHdCQUFjLENBQzNCO2dCQUNFLEdBQUcsRUFBRTtvQkFDSCxLQUFLLEVBQUUsRUFBRTtvQkFDVCxLQUFLLEVBQUUsT0FBTztvQkFDZCxLQUFLLEVBQUU7d0JBQ0wsV0FBVyxFQUFFLElBQUk7d0JBQ2pCLFdBQVcsRUFBRSxPQUFPO3FCQUNyQjtpQkFDRjthQUNGLEVBQ0QscUdBTUUsQ0FDSCxDQUFDO1lBRUYsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDM0IsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMseUNBQXlDLEVBQUU7WUFDNUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsR0FBRyxFQUFFO29CQUNILEtBQUssRUFBRSxFQUFFO29CQUNULEtBQUssRUFBRSxPQUFPO29CQUNkLEtBQUssRUFBRTt3QkFDTCxXQUFXLEVBQUUsSUFBSTt3QkFDakIsV0FBVyxFQUFFLE9BQU87cUJBQ3JCO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsMEJBQTBCLEVBQUU7WUFDN0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDbkUsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkJBQTZCLEVBQUU7WUFDaEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxxQ0FBcUMsRUFBRTtZQUN4QyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxzQkFBYyxDQUFDLENBQUM7UUFDcEYsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=