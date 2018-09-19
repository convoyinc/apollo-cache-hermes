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
    describe("nested parameterized value with array of nested references", function () {
        var nestedQuery, snapshot, parameterizedRootId;
        var entityId1, entityId2;
        var parameterizedIdInEntity1, parameterizedIdInEntity2;
        beforeAll(function () {
            nestedQuery = helpers_1.query("query nested($id: ID!) {\n        one {\n          two(id: $id) {\n            three {\n              id\n              four(extra: true) {\n                five\n              }\n            }\n          }\n        }\n      }", { id: 1 });
            parameterizedRootId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
            entityId1 = '31';
            entityId2 = '32';
            parameterizedIdInEntity1 = SnapshotEditor_1.nodeIdForParameterizedValue(entityId1, ['four'], { extra: true });
            parameterizedIdInEntity2 = SnapshotEditor_1.nodeIdForParameterizedValue(entityId2, ['four'], { extra: true });
            snapshot = write_1.write(context, empty, nestedQuery, {
                one: {
                    two: [
                        {
                            three: {
                                id: 31,
                                four: { five: 1 },
                            },
                        },
                        {
                            three: {
                                id: 32,
                                four: { five: 1 },
                            },
                        },
                    ],
                },
            }).snapshot;
        });
        it("writes a value snapshot for the containing field", function () {
            expect(snapshot.getNodeSnapshot(parameterizedRootId)).to.exist;
        });
        it("writes entity snapshots for each array entry", function () {
            expect(snapshot.getNodeSnapshot(entityId1)).to.exist;
            expect(snapshot.getNodeSnapshot(entityId2)).to.exist;
        });
        it("writes entity snapshots for each parameterized field of array entry", function () {
            expect(snapshot.getNodeSnapshot(parameterizedIdInEntity1)).to.exist;
            expect(snapshot.getNodeSnapshot(parameterizedIdInEntity2)).to.exist;
        });
        it("references the parent entity snapshot from the parameterized field", function () {
            var entry1 = snapshot.getNodeSnapshot(parameterizedIdInEntity1);
            expect(entry1.inbound).to.have.deep.members([{ id: entityId1, path: ['four'] }]);
            var entry2 = snapshot.getNodeSnapshot(parameterizedIdInEntity2);
            expect(entry2.inbound).to.have.deep.members([{ id: entityId2, path: ['four'] }]);
        });
        it("references the parameterized field children from the parent entity", function () {
            var entity1 = snapshot.getNodeSnapshot(entityId1);
            expect(entity1.outbound).to.have.deep.members([
                { id: parameterizedIdInEntity1, path: ['four'] },
            ]);
            var entity2 = snapshot.getNodeSnapshot(entityId2);
            expect(entity2.outbound).to.have.deep.members([
                { id: parameterizedIdInEntity2, path: ['four'] },
            ]);
        });
        it("references the children from the parameterized root", function () {
            var container = snapshot.getNodeSnapshot(parameterizedRootId);
            expect(container.outbound).to.have.deep.members([
                { id: entityId1, path: [0, 'three'] },
                { id: entityId2, path: [1, 'three'] },
            ]);
        });
        it("writes an array with the correct length", function () {
            // This is a bit arcane, but it ensures that _overlayParameterizedValues
            // behaves properly when iterating arrays that contain _only_
            // parameterized fields.
            expect(snapshot.getNodeData(parameterizedRootId)).to.deep.eq([
                {
                    three: { id: 31 },
                },
                {
                    three: { id: 32 },
                },
            ]);
        });
        it("allows removal of values containing a field", function () {
            var updated = write_1.write(context, snapshot, nestedQuery, {
                one: {
                    two: null,
                },
            }).snapshot;
            expect(updated.getNodeData(parameterizedRootId)).to.deep.eq(null);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlV2l0aEFycmF5T2ZOZXN0ZWRSZWZlcmVuY2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkUGFyYW1ldGVyaXplZFZhbHVlV2l0aEFycmF5T2ZOZXN0ZWRSZWZlcmVuY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0RBQTBEO0FBQzFELGtFQUFpRTtBQUNqRSwrRUFBMkY7QUFDM0YsNkRBQTREO0FBQzVELG9EQUErRTtBQUMvRSwrQ0FBMEQ7QUFFbEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBRWxDLFFBQVEsQ0FBQyw0REFBNEQsRUFBRTtRQUVyRSxJQUFJLFdBQXlCLEVBQUUsUUFBdUIsRUFBRSxtQkFBMkIsQ0FBQztRQUNwRixJQUFJLFNBQWlCLEVBQUUsU0FBaUIsQ0FBQztRQUN6QyxJQUFJLHdCQUFnQyxFQUFFLHdCQUFnQyxDQUFDO1FBRXZFLFNBQVMsQ0FBQztZQUNSLFdBQVcsR0FBRyxlQUFLLENBQUMsb09BV2xCLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVmLG1CQUFtQixHQUFHLDRDQUEyQixDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFGLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDakIsU0FBUyxHQUFHLElBQUksQ0FBQztZQUNqQix3QkFBd0IsR0FBRyw0Q0FBMkIsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxNQUFNLENBQUMs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