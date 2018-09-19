"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe("operations.write", function () {
    describe("object leaf-value with property id", function () {
        var snapshot, editedNodeIds;
        beforeAll(function () {
            var result = helpers_1.createSnapshot({
                foo: { id: 1 },
                bar: {
                    baz: { id: 1 },
                },
            }, "{ foo bar }");
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("stores the values", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                foo: { id: 1 },
                bar: {
                    baz: { id: 1 },
                },
            });
        });
        it("does not normalize the values of the object leaf-value", function () {
            expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
        });
        it("marks the container as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0TGVhZlZhbHVlV2l0aFByb3BlcnR5SWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvYmplY3RMZWFmVmFsdWVXaXRoUHJvcGVydHlJZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLG9EQUFpRTtBQUNqRSwrQ0FBcUQ7QUFFN0MsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUMzQixRQUFRLENBQUMsb0NBQW9DLEVBQUU7UUFFN0MsSUFBSSxRQUF1QixFQUFFLGFBQTBCLENBQUM7UUFDeEQsU0FBUyxDQUFDO1lBQ1IsSUFBTSxNQUFNLEdBQUcsd0JBQWMsQ0FDM0I7Z0JBQ0UsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDZCxHQUFHLEVBQUU7b0JBQ0gsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtpQkFDZjthQUNGLEVBQ0QsYUFBYSxDQUNkLENBQUM7WUFFRixRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUMzQixhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxtQkFBbUIsRUFBRTtZQUN0QixNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dCQUNkLEdBQUcsRUFBRTtvQkFDSCxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2lCQUNmO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsd0RBQXdELEVBQUU7WUFDM0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywrQkFBK0IsRUFBRTtZQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNuRSxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==