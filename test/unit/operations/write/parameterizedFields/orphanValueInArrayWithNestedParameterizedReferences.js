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
    describe("orphans value in array with nested parameterized references", function () {
        var rootedQuery, snapshot, entityBarId1;
        beforeAll(function () {
            rootedQuery = helpers_1.query("{\n        foo {\n          bar(extra: true) {\n            baz { id }\n          }\n        }\n      }");
            entityBarId1 = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['foo', 1, 'bar'], { extra: true });
            var baseSnapshot = write_1.write(context, empty, rootedQuery, {
                foo: [
                    { bar: { baz: { id: 1 } } },
                    { bar: { baz: { id: 2 } } },
                ],
            }).snapshot;
            var result = write_1.write(context, baseSnapshot, rootedQuery, {
                foo: [
                    { bar: { baz: { id: 1 } } },
                ],
            });
            snapshot = result.snapshot;
        });
        it("doesn't contain the orphaned parameterized value", function () {
            expect(snapshot.allNodeIds()).to.not.include(entityBarId1);
        });
        it("doesn't contain transitively orphaned nodes", function () {
            expect(snapshot.allNodeIds()).to.not.include('2');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JwaGFuVmFsdWVJbkFycmF5V2l0aE5lc3RlZFBhcmFtZXRlcml6ZWRSZWZlcmVuY2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsib3JwaGFuVmFsdWVJbkFycmF5V2l0aE5lc3RlZFBhcmFtZXRlcml6ZWRSZWZlcmVuY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0RBQTBEO0FBQzFELGtFQUFpRTtBQUNqRSwrRUFBMkY7QUFDM0YsNkRBQTREO0FBQzVELG9EQUErRTtBQUMvRSwrQ0FBMEQ7QUFFbEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBRWxDLFFBQVEsQ0FBQyw2REFBNkQsRUFBRTtRQUV0RSxJQUFJLFdBQXlCLEVBQUUsUUFBdUIsRUFBRSxZQUFvQixDQUFDO1FBQzdFLFNBQVMsQ0FBQztZQUNSLFdBQVcsR0FBRyxlQUFLLENBQUMseUdBTWxCLENBQUMsQ0FBQztZQUVKLFlBQVksR0FBRyw0Q0FBMkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFcEYsSUFBQTs7Ozs7dUJBQXNCLENBSzNCO1lBRUgsSUFBTSxNQUFNLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFO2dCQUN2RCxHQUFHLEVBQUU7b0JBQ0gsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRTtpQkFDNUI7YUFDRixDQUFDLENBQUM7WUFDSCxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxrREFBa0QsRUFBRTtZQUNyRCxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDN0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUU7WUFDaEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9