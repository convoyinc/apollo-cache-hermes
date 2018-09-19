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
    describe("nested parameterized references with parameterized value", function () {
        var nestedQuery, snapshot, parameterizedRootId, parameterizedFieldId, entityId;
        beforeAll(function () {
            nestedQuery = helpers_1.query("query nested($id: ID!) {\n        one {\n          two(id: $id) {\n            three {\n              id\n              four(extra: true) {\n                five\n              }\n            }\n          }\n        }\n      }", { id: 1 });
            entityId = '31';
            parameterizedRootId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
            parameterizedFieldId = SnapshotEditor_1.nodeIdForParameterizedValue(entityId, ['four'], { extra: true });
            snapshot = write_1.write(context, empty, nestedQuery, {
                one: {
                    two: {
                        three: {
                            id: 31,
                            four: { five: 1 },
                        },
                    },
                },
            }).snapshot;
        });
        it("writes a value snapshot for the containing field", function () {
            expect(snapshot.getNodeSnapshot(parameterizedRootId)).to.exist;
        });
        it("writes value snapshots for each array entry", function () {
            expect(snapshot.getNodeSnapshot(parameterizedFieldId)).to.exist;
        });
        it("references the parent entity snapshot from the children", function () {
            var entry1 = snapshot.getNodeSnapshot(parameterizedFieldId);
            expect(entry1.inbound).to.have.deep.members([{ id: entityId, path: ['four'] }]);
        });
        it("references the children from the parent entity", function () {
            var entity = snapshot.getNodeSnapshot(entityId);
            expect(entity.outbound).to.have.deep.members([
                { id: parameterizedFieldId, path: ['four'] },
            ]);
        });
        it("references the children from the parameterized root", function () {
            var container = snapshot.getNodeSnapshot(parameterizedRootId);
            expect(container.outbound).to.have.deep.members([
                { id: entityId, path: ['three'] },
            ]);
        });
        it("writes an array with the correct length", function () {
            // This is a bit arcane, but it ensures that _overlayParameterizedValues
            // behaves properly when iterating arrays that contain _only_
            // parameterized fields.
            expect(snapshot.getNodeData(parameterizedRootId)).to.deep.eq({ three: { id: 31 } });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZXNXaXRoUGFyYW1ldGVyaXplZFZhbHVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZXNXaXRoUGFyYW1ldGVyaXplZFZhbHVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0RBQTBEO0FBQzFELGtFQUFpRTtBQUNqRSwrRUFBMkY7QUFDM0YsNkRBQTREO0FBQzVELG9EQUErRTtBQUMvRSwrQ0FBMEQ7QUFFbEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBRWxDLFFBQVEsQ0FBQywwREFBMEQsRUFBRTtRQUVuRSxJQUFJLFdBQXlCLEVBQUUsUUFBdUIsRUFBRSxtQkFBMkIsRUFBRSxvQkFBNEIsRUFBRSxRQUFnQixDQUFDO1FBQ3BJLFNBQVMsQ0FBQztZQUNSLFdBQVcsR0FBRyxlQUFLLENBQUMsb09BV2xCLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVmLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDaEIsbUJBQW1CLEdBQUcsNENBQTJCLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUYsb0JBQW9CLEdBQUcsNENBQTJCLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUV4RixRQUFRLEdBQUcsYUFBSyxDQUFDLE9BQU8s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