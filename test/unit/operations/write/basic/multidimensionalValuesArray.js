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
    describe("simple leaf-values hanging off a root", function () {
        var snapshot;
        beforeAll(function () {
            var result = helpers_1.createSnapshot({
                rows: [
                    [
                        { value: 1 },
                        { value: 2 },
                    ],
                    [
                        { value: 3 },
                        { value: 4 },
                    ],
                ],
            }, "{\n          rows {\n            value\n          }\n        }");
            snapshot = result.snapshot;
        });
        it("creates the query root, with the values", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                rows: [
                    [
                        { value: 1 },
                        { value: 2 },
                    ],
                    [
                        { value: 3 },
                        { value: 4 },
                    ],
                ],
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlkaW1lbnNpb25hbFZhbHVlc0FycmF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXVsdGlkaW1lbnNpb25hbFZhbHVlc0FycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esb0RBQXlEO0FBQ3pELCtDQUFxRDtBQUU3QyxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBQzNCLFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRTtRQUVoRCxJQUFJLFFBQXVCLENBQUM7UUFDNUIsU0FBUyxDQUFDO1lBQ1IsSUFBTSxNQUFNLEdBQUcsd0JBQWMsQ0FDM0I7Z0JBQ0UsSUFBSSxFQUFFO29CQUNKO3dCQUNFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt3QkFDWixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7cUJBQ2I7b0JBQ0Q7d0JBQ0UsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3dCQUNaLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtxQkFDYjtpQkFDRjthQUNGLEVBQ0QsZ0VBSUUsQ0FDSCxDQUFDO1lBQ0YsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMseUNBQXlDLEVBQUU7WUFDNUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsSUFBSSxFQUFFO29CQUNKO3dCQUNFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt3QkFDWixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7cUJBQ2I7b0JBQ0Q7d0JBQ0UsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3dCQUNaLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtxQkFDYjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9