"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var nodes_1 = require("../../../../../src/nodes");
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
    describe("nested value with fragment spread", function () {
        var snapshot, editedNodeIds;
        beforeAll(function () {
            var viewerQuery = helpers_1.query("\n        query getViewer {\n          viewer {\n            id\n            name\n            address {\n              ...ShortAddress\n            }\n          }\n        }\n        fragment ShortAddress on Address {\n          city\n          postal\n        }\n      ");
            var result = write_1.write(context, empty, viewerQuery, {
                viewer: {
                    id: 123,
                    name: 'Gouda',
                    address: {
                        city: 'seattle',
                        postal: '98090',
                    },
                },
            });
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("creates the query root, referencing the entity", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                viewer: {
                    id: 123,
                    name: 'Gouda',
                    address: {
                        city: 'seattle',
                        postal: '98090',
                    },
                },
            });
        });
        it("indexes the entity", function () {
            expect(snapshot.getNodeData('123')).to.deep.eq({
                id: 123,
                name: 'Gouda',
                address: {
                    city: 'seattle',
                    postal: '98090',
                },
            });
        });
        it("emits the root as an EntitySnapshot", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
        it("emits the entity as an EntitySnapshot", function () {
            expect(snapshot.getNodeSnapshot('123')).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
        it("directly references viewer from the query root", function () {
            var queryRoot = snapshot.getNodeData(QueryRootId);
            var viewer = snapshot.getNodeData('123');
            expect(queryRoot.viewer).to.eq(viewer);
        });
        it("records the outbound reference from the query root", function () {
            var queryRoot = snapshot.getNodeSnapshot(QueryRootId);
            expect(queryRoot.outbound).to.deep.eq([{ id: '123', path: ['viewer'] }]);
            expect(queryRoot.inbound).to.eq(undefined);
        });
        it("records the inbound reference from referenced entity", function () {
            var queryRoot = snapshot.getNodeSnapshot('123');
            expect(queryRoot.inbound).to.deep.eq([{ id: QueryRootId, path: ['viewer'] }]);
            expect(queryRoot.outbound).to.eq(undefined);
        });
        it("marks the entity and root as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members([QueryRootId, '123']);
        });
        it("only contains the two nodes", function () {
            expect(snapshot.allNodeIds()).to.have.members([QueryRootId, '123']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkVmFsdWVVc2luZ0ZyYWdtZW50U3ByZWFkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkVmFsdWVVc2luZ0ZyYWdtZW50U3ByZWFkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0RBQTBEO0FBQzFELGtFQUFpRTtBQUNqRSxrREFBMEQ7QUFDMUQsNkRBQTREO0FBQzVELG9EQUFpRTtBQUNqRSwrQ0FBMEQ7QUFFbEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBRWxDLFFBQVEsQ0FBQyxtQ0FBbUMsRUFBRTtRQUU1QyxJQUFJLFFBQXVCLEVBQUUsYUFBMEIsQ0FBQztRQUN4RCxTQUFTLENBQUM7WUFDUixJQUFNLFdBQVcsR0FBRyxlQUFLLENBQUMsaVJBY3pCLENBQUMsQ0FBQztZQUVILElBQU0sTUFBTSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTtnQkFDaEQsTUFBTSxFQUFFO29CQUNOLEVBQUUsRUFBRSxHQUFHO29CQUNQLElBQUksRUFBRSxPQUFPO29CQUNiLE9BQU8sRUFBRTt3QkFDUCxJQUFJLEVBQUUsU0FBUzt3QkFDZixNQUFNLEVBQUUsT0FBTztxQkFDaEI7aUJBQ0Y7YUFDRixDQUFDLENBQUM7WUFDSCxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUMzQixhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxnREFBZ0QsRUFBRTtZQUNuRCxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FB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