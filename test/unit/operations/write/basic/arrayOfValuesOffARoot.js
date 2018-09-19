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
    describe("array of values hanging off of a root", function () {
        var snapshot, editedNodeIds;
        beforeAll(function () {
            var result = helpers_1.createSnapshot({
                viewer: [
                    {
                        postal: 123,
                        name: 'Gouda',
                    },
                    {
                        postal: 456,
                        name: 'Brie',
                    },
                ],
            }, "{ viewer { postal name } }");
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("creates the query root, referencing the entity", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                viewer: [
                    {
                        postal: 123,
                        name: 'Gouda',
                    },
                    {
                        postal: 456,
                        name: 'Brie',
                    },
                ],
            });
        });
        it("emits the root as an EntitySnapshot", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
        it("directly references a first entity of viewer from the query root", function () {
            var queryRoot = snapshot.getNodeData(QueryRootId);
            expect(queryRoot.viewer[0]).to.deep.eq({
                postal: 123,
                name: 'Gouda',
            });
        });
        it("records the outbound and inbound reference from the query root", function () {
            var queryRoot = snapshot.getNodeSnapshot(QueryRootId);
            expect(queryRoot.outbound).to.eq(undefined);
            expect(queryRoot.inbound).to.eq(undefined);
        });
        it("marks a query root as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([QueryRootId]);
        });
        it("only contains a one node", function () {
            expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlPZlZhbHVlc09mZkFSb290LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXJyYXlPZlZhbHVlc09mZkFSb290LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esa0RBQTBEO0FBQzFELG9EQUFpRTtBQUNqRSwrQ0FBcUQ7QUFFN0MsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUMzQixRQUFRLENBQUMsdUNBQXVDLEVBQUU7UUFFaEQsSUFBSSxRQUF1QixFQUFFLGFBQTBCLENBQUM7UUFDeEQsU0FBUyxDQUFDO1lBQ1IsSUFBTSxNQUFNLEdBQUcsd0JBQWMsQ0FDM0I7Z0JBQ0UsTUFBTSxFQUFFO29CQUNOO3dCQUNFLE1BQU0sRUFBRSxHQUFHO3dCQUNYLElBQUksRUFBRSxPQUFPO3FCQUNkO29CQUNEO3dCQUNFLE1BQU0sRUFBRSxHQUFHO3dCQUNYLElBQUksRUFBRSxNQUFNO3FCQUNiO2lCQUNGO2FBQ0YsRUFDRCw0QkFBNEIsQ0FDN0IsQ0FBQztZQUNGLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1lBQzNCLGFBQWEsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGdEQUFnRCxFQUFFO1lBQ25ELE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ25ELE1BQU0sRUFBRTtvQkFDTjt3QkFDRSxNQUFNLEVBQUUsR0FBRzt3QkFDWCxJQUFJLEVBQUUsT0FBTztxQkFDZDtvQkFDRDt3QkFDRSxNQUFNLEVBQUUsR0FBRzt3QkFDWCxJQUFJLEVBQUUsTUFBTTtxQkFDYjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHFDQUFxQyxFQUFFO1lBQ3hDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLHNCQUFjLENBQUMsQ0FBQztRQUNwRixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxrRUFBa0UsRUFBRTtZQUNyRSxJQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sRUFBRSxHQUFHO2dCQUNYLElBQUksRUFBRSxPQUFPO2FBQ2QsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsZ0VBQWdFLEVBQUU7WUFDbkUsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUUsQ0FBQztZQUN6RCxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDhCQUE4QixFQUFFO1lBQ2pDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDBCQUEwQixFQUFFO1lBQzdCLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=