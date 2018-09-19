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
    describe("object leaf-value hanging off a root", function () {
        var snapshot, editedNodeIds;
        beforeAll(function () {
            var result = helpers_1.createSnapshot({
                foo: {},
                bar: {
                    value: 'this is a bar',
                    extraProp: {
                        prop1: 100,
                        prop2: 200,
                    },
                    extraProp1: {
                        prop0: 'hello',
                    },
                },
            }, "{ foo bar }");
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("creates the query root, with the values", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                foo: {},
                bar: {
                    value: 'this is a bar',
                    extraProp: {
                        prop1: 100,
                        prop2: 200,
                    },
                    extraProp1: {
                        prop0: 'hello',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0TGVhZlZhbHVlT2ZmQVJvb3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvYmplY3RMZWFmVmFsdWVPZmZBUm9vdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLGtEQUEwRDtBQUMxRCxvREFBaUU7QUFDakUsK0NBQXFEO0FBRTdDLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELGdGQUFnRjtBQUNoRixFQUFFO0FBQ0YsNkVBQTZFO0FBQzdFLGdGQUFnRjtBQUNoRixRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFDM0IsUUFBUSxDQUFDLHNDQUFzQyxFQUFFO1FBRS9DLElBQUksUUFBdUIsRUFBRSxhQUEwQixDQUFDO1FBQ3hELFNBQVMsQ0FBQztZQUNSLElBQU0sTUFBTSxHQUFHLHdCQUFjLENBQzNCO2dCQUNFLEdBQUcsRUFBRSxFQUFFO2dCQUNQLEdBQUcsRUFBRTtvQkFDSCxLQUFLLEVBQUUsZUFBZTtvQkFDdEIsU0FBUyxFQUFFO3dCQUNULEtBQUssRUFBRSxHQUFHO3dCQUNWLEtBQUssRUFBRSxHQUFHO3FCQUNYO29CQUNELFVBQVUsRUFBRTt3QkFDVixLQUFLLEVBQUUsT0FBTztxQkFDZjtpQkFDRjthQUNGLEVBQ0QsYUFBYSxDQUNkLENBQUM7WUFFRixRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUMzQixhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRTtZQUM1QyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxHQUFHLEVBQUUsRUFBRTtnQkFDUCxHQUFHLEVBQUU7b0JBQ0gsS0FBSyxFQUFFLGVBQWU7b0JBQ3RCLFNBQVMsRUFBRTt3QkFDVCxLQUFLLEVBQUUsR0FBRzt3QkFDVixLQUFLLEVBQUUsR0FBRztxQkFDWDtvQkFDRCxVQUFVLEVBQUU7d0JBQ1YsS0FBSyxFQUFFLE9BQU87cUJBQ2Y7aUJBQ0Y7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywwQkFBMEIsRUFBRTtZQUM3QixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNuRSxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2QkFBNkIsRUFBRTtZQUNoQyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQy9ELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHFDQUFxQyxFQUFFO1lBQ3hDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLHNCQUFjLENBQUMsQ0FBQztRQUNwRixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==