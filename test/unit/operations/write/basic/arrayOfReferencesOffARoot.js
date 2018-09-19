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
    describe("new array of references hanging off of a root", function () {
        var snapshot, editedNodeIds;
        beforeAll(function () {
            var result = helpers_1.createSnapshot({
                viewer: [
                    {
                        id: 123,
                        name: 'Gouda',
                    },
                    {
                        id: 456,
                        name: 'Brie',
                    },
                ],
            }, "{ viewer { id name } }");
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("creates the query root, referencing the entity", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                viewer: [
                    {
                        id: 123,
                        name: 'Gouda',
                    },
                    {
                        id: 456,
                        name: 'Brie',
                    },
                ],
            });
        });
        it("indexes the first entity in an array", function () {
            expect(snapshot.getNodeData('123')).to.deep.eq({
                id: 123,
                name: 'Gouda',
            });
        });
        it("indexes the second entity in an array", function () {
            expect(snapshot.getNodeData('456')).to.deep.eq({
                id: 456,
                name: 'Brie',
            });
        });
        it("emits the root as an EntitySnapshot", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
        it("emits the first entity as an EntitySnapshot", function () {
            expect(snapshot.getNodeSnapshot('123')).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
        it("emits the second entity as an EntitySnapshot", function () {
            expect(snapshot.getNodeSnapshot('456')).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
        it("directly references a first entity of viewer from the query root", function () {
            var queryRoot = snapshot.getNodeData(QueryRootId);
            var viewer = snapshot.getNodeData('123');
            expect(queryRoot.viewer[0]).to.eq(viewer);
        });
        it("records the outbound and inbound reference from the query root", function () {
            var queryRoot = snapshot.getNodeSnapshot(QueryRootId);
            expect(queryRoot.outbound).to.deep.eq([{ id: '123', path: ['viewer', 0] }, { id: '456', path: ['viewer', 1] }]);
            expect(queryRoot.inbound).to.eq(undefined);
        });
        it("records the inbound and outbound reference from referenced entity", function () {
            var queryRoot = snapshot.getNodeSnapshot('123');
            expect(queryRoot.inbound).to.deep.eq([{ id: QueryRootId, path: ['viewer', 0] }]);
            expect(queryRoot.outbound).to.eq(undefined);
        });
        it("marks two entity in an array and root as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '123', '456']);
        });
        it("only contains the three nodes", function () {
            expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '123', '456']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlPZlJlZmVyZW5jZXNPZmZBUm9vdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFycmF5T2ZSZWZlcmVuY2VzT2ZmQVJvb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxrREFBMEQ7QUFDMUQsb0RBQWlFO0FBQ2pFLCtDQUFxRDtBQUU3QyxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBQzNCLFFBQVEsQ0FBQywrQ0FBK0MsRUFBRTtRQUV4RCxJQUFJLFFBQXVCLEVBQUUsYUFBMEIsQ0FBQztRQUN4RCxTQUFTLENBQUM7WUFDUixJQUFNLE1BQU0sR0FBRyx3QkFBYyxDQUMzQjtnQkFDRSxNQUFNLEVBQUU7b0JBQ047d0JBQ0UsRUFBRSxFQUFFLEdBQUc7d0JBQ1AsSUFBSSxFQUFFLE9BQU87cUJBQ2Q7b0JBQ0Q7d0JBQ0UsRUFBRSxFQUFFLEdBQUc7d0JBQ1AsSUFBSSxFQUFFLE1BQU07cUJBQ2I7aUJBQ0Y7YUFDRixFQUNELHdCQUF3QixDQUN6QixDQUFDO1lBRUYsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDM0IsYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsZ0RBQWdELEVBQUU7WUFDbkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxFQUFFO29CQUNOO3dCQUNFLEVBQUUsRUFBRSxHQUFHO3dCQUNQLElBQUksRUFBRSxPQUFPO3FCQUNkO29CQUNEO3dCQUNFLEVBQUUsRUFBRSxHQUFHO3dCQUNQLElBQUksRUFBRSxNQUFNO3FCQUNiO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FB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