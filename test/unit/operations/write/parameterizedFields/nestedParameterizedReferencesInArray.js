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
    describe("nested parameterized references in an array", function () {
        var nestedQuery, snapshot, containerId;
        beforeAll(function () {
            nestedQuery = helpers_1.query("\n        query nested($id: ID!) {\n          one {\n            two(id: $id) {\n              three { id }\n            }\n          }\n        }", { id: 1 });
            containerId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
            snapshot = write_1.write(context, empty, nestedQuery, {
                one: {
                    two: [
                        { three: { id: 1 } },
                        { three: { id: 2 } },
                    ],
                },
            }).snapshot;
        });
        it("writes a value snapshot for the containing field", function () {
            expect(snapshot.getNodeSnapshot(containerId)).to.exist;
        });
        it("writes value snapshots for each array entry", function () {
            expect(snapshot.getNodeSnapshot('1')).to.exist;
            expect(snapshot.getNodeSnapshot('2')).to.exist;
        });
        it("references the parent snapshot from the children", function () {
            var entry1 = snapshot.getNodeSnapshot('1');
            var entry2 = snapshot.getNodeSnapshot('2');
            expect(entry1.inbound).to.have.deep.members([{ id: containerId, path: [0, 'three'] }]);
            expect(entry2.inbound).to.have.deep.members([{ id: containerId, path: [1, 'three'] }]);
        });
        it("references the children from the parent", function () {
            var container = snapshot.getNodeSnapshot(containerId);
            expect(container.outbound).to.have.deep.members([
                { id: '1', path: [0, 'three'] },
                { id: '2', path: [1, 'three'] },
            ]);
        });
        it("allows shifting from the front", function () {
            var updated = write_1.write(context, snapshot, nestedQuery, {
                one: {
                    two: [
                        { three: { id: 2 } },
                    ],
                },
            }).snapshot;
            expect(updated.getNodeSnapshot(containerId).outbound).to.have.deep.members([
                { id: '2', path: [0, 'three'] },
            ]);
            expect(updated.getNodeSnapshot('2').inbound).to.have.deep.members([
                { id: containerId, path: [0, 'three'] },
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZXNJbkFycmF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZXNJbkFycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0RBQTBEO0FBQzFELGtFQUFpRTtBQUNqRSwrRUFBMkY7QUFDM0YsNkRBQTREO0FBQzVELG9EQUErRTtBQUMvRSwrQ0FBMEQ7QUFFbEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBRWxDLFFBQVEsQ0FBQyw2Q0FBNkMsRUFBRTtRQUV0RCxJQUFJLFdBQXlCLEVBQUUsUUFBdUIsRUFBRSxXQUFtQixDQUFDO1FBQzVFLFNBQVMsQ0FBQztZQUNSLFdBQVcsR0FBRyxlQUFLLENBQUMsb0pBT2hCLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVqQixXQUFXLEdBQUcsNENBQTJCLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFbEYsUUFBUSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTtnQkFDNUMsR0FBRyxFQUFFO29CQUNILEdBQUcsRUFBRTt3QkFDSCxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTt3QkFDcEIsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7cUJBQ3JCO2lCQUNGO2FB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