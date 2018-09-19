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
    describe("nested values in array using fragment spread", function () {
        var snapshot, editedNodeIds;
        beforeAll(function () {
            var viewerQuery = helpers_1.query("\n        query getViewer {\n          viewer {\n            id\n            name\n            articles {\n              ...ShortArticle\n            }\n          }\n        }\n        fragment ShortArticle on Article {\n          createAt\n          title\n          details {\n            body\n            ref\n          }\n        }\n      ");
            var result = write_1.write(context, empty, viewerQuery, {
                viewer: {
                    id: 123,
                    name: 'Gouda',
                    articles: [
                        {
                            createAt: '10/01',
                            title: 'Hello',
                            details: {
                                body: 'Hello - body',
                                ref: 'Hello-ref',
                            },
                        },
                        {
                            createAt: '10/02',
                            title: null,
                            details: {
                                body: 'world - body',
                                ref: null,
                            },
                        },
                    ],
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
                    articles: [
                        {
                            createAt: '10/01',
                            title: 'Hello',
                            details: {
                                body: 'Hello - body',
                                ref: 'Hello-ref',
                            },
                        },
                        {
                            createAt: '10/02',
                            title: null,
                            details: {
                                body: 'world - body',
                                ref: null,
                            },
                        },
                    ],
                },
            });
        });
        it("indexes the entity", function () {
            expect(snapshot.getNodeData('123')).to.deep.eq({
                id: 123,
                name: 'Gouda',
                articles: [
                    {
                        createAt: '10/01',
                        title: 'Hello',
                        details: {
                            body: 'Hello - body',
                            ref: 'Hello-ref',
                        },
                    },
                    {
                        createAt: '10/02',
                        title: null,
                        details: {
                            body: 'world - body',
                            ref: null,
                        },
                    },
                ],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkVmFsdWVzSW5BcnJheVVzaW5nRnJhZ21lbnRTcHJlYWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXN0ZWRWYWx1ZXNJbkFycmF5VXNpbmdGcmFnbWVudFNwcmVhZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsa0RBQTBEO0FBQzFELDZEQUE0RDtBQUM1RCxvREFBaUU7QUFDakUsK0NBQTBEO0FBRWxELElBQUEsNkNBQXNCLENBQWtCO0FBRWhELGdGQUFnRjtBQUNoRixFQUFFO0FBQ0YsNkVBQTZFO0FBQzdFLGdGQUFnRjtBQUNoRixRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFFM0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyxJQUFNLEtBQUssR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztJQUVsQyxRQUFRLENBQUMsOENBQThDLEVBQUU7UUFDdkQsSUFBSSxRQUF1QixFQUFFLGFBQTBCLENBQUM7UUFDeEQsU0FBUyxDQUFDO1lBQ1IsSUFBTSxXQUFXLEdBQUcsZUFBSyxDQUFDLDBWQWtCekIsQ0FBQyxDQUFDO1lBRUgsSUFBTSxNQUFNLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFO2dCQUNoRCxNQUFNLEVBQUU7b0JBQ04sRUFBRSxFQUFFLEdBQUc7b0JBQ1AsSUFBSSxFQUFFLE9BQU87b0JBQ2IsUUFBUSxFQUFFO3dCQUNSOzRCQUNFLFFBQVEsRUFBRSxPQUFPOzRCQUNqQixLQUFLLEVBQUUsT0FBTzs0QkFDZCxPQUFPLEVBQUU7Z0NBQ1AsSUFBSSxFQUFFLGNBQWM7Z0NBQ3BCLEdBQUcsRUFBRSxXQUFXOzZCQUNqQjt5QkFDRjt3QkFDRDs0QkFDRSxRQUFRLEVBQUUsT0FBTzs0QkFDakIsS0FBSyxFQUFFLElBQUk7NEJBQ1gsT0FBTyxFQUFFO2dDQUNQLElBQUksRUFBRSxjQUFj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