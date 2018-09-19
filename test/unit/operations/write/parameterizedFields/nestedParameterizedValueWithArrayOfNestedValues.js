"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
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
    describe("nested parameterized value with an array of nested values", function () {
        var nestedQuery, snapshot, containerId;
        beforeAll(function () {
            nestedQuery = helpers_1.query("query nested($id: ID!) {\n        one {\n          two(id: $id) {\n            three {\n              threeValue\n            }\n          }\n        }\n      }", { id: 1 });
            containerId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
            snapshot = write_1.write(context, empty, nestedQuery, {
                one: {
                    two: [
                        {
                            three: {
                                threeValue: 'first',
                            },
                        },
                        {
                            three: {
                                threeValue: 'second',
                            },
                        },
                    ],
                },
            }).snapshot;
        });
        it("no references from the parent", function () {
            var container = snapshot.getNodeSnapshot(containerId);
            expect(container.outbound).to.eq(undefined);
        });
        it("writes an array with the correct length", function () {
            // This is a bit arcane, but it ensures that _overlayParameterizedValues
            // behaves properly when iterating arrays that contain _only_
            // parameterized fields.
            expect(snapshot.getNodeData(containerId)).to.deep.eq([
                {
                    three: {
                        threeValue: 'first',
                    },
                },
                {
                    three: {
                        threeValue: 'second',
                    },
                },
            ]);
        });
        it("allows removal of values containing a field", function () {
            var updated = write_1.write(context, snapshot, nestedQuery, {
                one: {
                    two: [
                        null,
                        {
                            three: {
                                threeValue: 'second',
                            },
                        },
                    ],
                },
            }).snapshot;
            expect(updated.getNodeData(containerId)).to.deep.eq([
                null,
                {
                    three: {
                        threeValue: 'second',
                    },
                },
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlV2l0aEFycmF5T2ZOZXN0ZWRWYWx1ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXN0ZWRQYXJhbWV0ZXJpemVkVmFsdWVXaXRoQXJyYXlPZk5lc3RlZFZhbHVlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsK0VBQTJGO0FBQzNGLDZEQUE0RDtBQUM1RCxvREFBK0U7QUFDL0UsK0NBQTBEO0FBRWxELElBQUEsNkNBQXNCLENBQWtCO0FBRWhELGdGQUFnRjtBQUNoRixFQUFFO0FBQ0YsNkVBQTZFO0FBQzdFLGdGQUFnRjtBQUNoRixRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFFM0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyxJQUFNLEtBQUssR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztJQUVsQyxRQUFRLENBQUMsMkRBQTJELEVBQUU7UUFFcEUsSUFBSSxXQUF5QixFQUFFLFFBQXVCLEVBQUUsV0FBbUIsQ0FBQztRQUM1RSxTQUFTLENBQUM7WUFDUixXQUFXLEdBQUcsZUFBSyxDQUFDLGtLQVFsQixFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFZixXQUFXLEdBQUcsNENBQTJCLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFbEYsUUFBUSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTtnQkFDNUMsR0FBRyxFQUFFO29CQUNILEdBQUcsRUFBRTt3QkFDSDs0QkFDRSxLQUFLLEVBQUU7Z0NBQ0wsVUFBVSxFQUFFLE9BQU87NkJBQ3BCO3lCQUNGO3dCQUNEOzRCQUNFLEtBQUssRUFBRTtnQ0FDTCxVQUFVLEVBQUUsUUFBUTs2QkFDckI7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7YUFDRixDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsK0JBQStCLEVBQUU7WUFDbEMsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUUsQ0FBQztZQUN6RCxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMseUNBQXlDLEVBQUU7WUFDNUMsd0VBQXdFO1lBQ3hFLDZEQUE2RDtZQUM3RCx3QkFBd0I7WUFDeEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQ7b0JBQ0UsS0FBSyxFQUFFO3dCQUNMLFVBQVUsRUFBRSxPQUFPO3FCQUNwQjtpQkFDRjtnQkFDRDtvQkFDRSxLQUFLLEVBQUU7d0JBQ0wsVUFBVSxFQUFFLFFBQVE7cUJBQ3JCO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUU7WUFDaEQsSUFBTSxPQUFPLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFO2dCQUNwRCxHQUFHLEVBQUU7b0JBQ0gsR0FBRyxFQUFFO3dCQUNILElBQUk7d0JBQ0o7NEJBQ0UsS0FBSyxFQUFFO2dDQUNMLFVBQVUsRUFBRSxRQUFROzZCQUNyQjt5QkFDRjtxQkFDRjtpQkFDRjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFFWixNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNsRCxJQUFJO2dCQUNKO29CQUNFLEtBQUssRUFBRTt3QkFDTCxVQUFVLEVBQUUsUUFBUTtxQkFDckI7aUJBQ0Y7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==