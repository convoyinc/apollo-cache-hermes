"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var write_1 = require("../../../../../src/operations/write");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.write", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    describe("with @static", function () {
        describe("with @static fields", function () {
            var staticQuery = helpers_1.query("{\n        todos {\n          id\n          value: rawValue @static\n          history(limit: 2) @static {\n            changeType\n            value\n          }\n        }\n      }");
            var snapshot;
            beforeAll(function () {
                snapshot = write_1.write(context, empty, staticQuery, {
                    todos: [
                        {
                            id: 1,
                            value: 'hello',
                            history: [
                                {
                                    changeType: 'edit',
                                    value: 'ohai',
                                },
                                {
                                    changeType: 'edit',
                                    value: 'hey',
                                },
                            ],
                        },
                    ],
                }).snapshot;
            });
            it("writes static fields to the containing entity", function () {
                expect(snapshot.getNodeData('1')).to.deep.eq({
                    id: 1,
                    value: 'hello',
                    history: [
                        {
                            changeType: 'edit',
                            value: 'ohai',
                        },
                        {
                            changeType: 'edit',
                            value: 'hey',
                        },
                    ],
                });
            });
            it("does not create parameterized field nodes", function () {
                expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '1']);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljRGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3RhdGljRGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0RBQTBEO0FBQzFELGtFQUFpRTtBQUNqRSw2REFBNEQ7QUFDNUQsb0RBQXlEO0FBQ3pELCtDQUEwRDtBQUVsRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFFM0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyxJQUFNLEtBQUssR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztJQUVsQyxRQUFRLENBQUMsY0FBYyxFQUFFO1FBRXZCLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRTtZQUU5QixJQUFNLFdBQVcsR0FBRyxlQUFLLENBQUMsd0xBU3hCLENBQUMsQ0FBQztZQUVKLElBQUksUUFBdUIsQ0FBQztZQUM1QixTQUFTLENBQUM7Z0JBQ1IsUUFBUSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTtvQkFDNUMsS0FBSyxFQUFFO3dCQUNMOzRCQUNFLEVBQUUsRUFBRSxDQUFDOzRCQUNMLEtBQUssRUFBRSxPQUFPOzRCQUNkLE9BQU8sRUFBRTtnQ0FDUDtvQ0FDRSxVQUFVLEVBQUUsTUFBTTtvQ0FDbEIsS0FBSyxFQUFFLE1BQU07aUNBQ2Q7Z0NBQ0Q7b0NBQ0UsVUFBVSxFQUFFLE1BQU07b0NBQ2xCLEtBQUssRUFBRSxLQUFLO2lDQUNiOzZCQUNGO3lCQUNGO3FCQUNGO2lCQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDZCxDQUFDLENBQUMsQ0FBQztZQUVILEVBQUUsQ0FBQywrQ0FBK0MsRUFBRTtnQkFDbEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDM0MsRUFBRSxFQUFFLENBQUM7b0JBQ0wsS0FBSyxFQUFFLE9BQU87b0JBQ2QsT0FBTyxFQUFFO3dCQUNQOzRCQUNFLFVBQVUsRUFBRSxNQUFNOzRCQUNsQixLQUFLLEVBQUUsTUFBTTt5QkFDZDt3QkFDRDs0QkFDRSxVQUFVLEVBQUUsTUFBTTs0QkFDbEIsS0FBSyxFQUFFLEtBQUs7eUJBQ2I7cUJBQ0Y7aUJBQ0YsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMsMkNBQTJDLEVBQUU7Z0JBQzlDLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLENBQUMsQ0FBQyxDQUFDO1FBRUwsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=