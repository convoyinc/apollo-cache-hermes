"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
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
    var basicQuery = helpers_1.query("{ foo }");
    describe("minimal updates values of arrays", function () {
        it("preserves scalar arrays if none of their values change", function () {
            var baseSnapshot = write_1.write(context, empty, basicQuery, { foo: [1, 2, 3] }).snapshot;
            var snapshot = write_1.write(context, baseSnapshot, basicQuery, { foo: [1, 2, 3] }).snapshot;
            expect(snapshot.getNodeData(QueryRootId)).to.eq(baseSnapshot.getNodeData(QueryRootId));
        });
        it("preserves complex arrays if none of their values change", function () {
            var value1 = { nested: { value: 1 } };
            var value2 = { nested: { value: 2 } };
            var value3 = { nested: { value: 3 } };
            var baseSnapshot = write_1.write(context, empty, basicQuery, {
                foo: [value1, value2, value3],
            }).snapshot;
            var snapshot = write_1.write(context, baseSnapshot, basicQuery, {
                foo: [value1, value2, value3],
            }).snapshot;
            expect(snapshot.getNodeData(QueryRootId)).to.eq(baseSnapshot.getNodeData(QueryRootId));
        });
        it("only edits values that do change", function () {
            var value1 = { nested: { value: 1 } };
            var value2 = { nested: { value: 2 } };
            var value3 = { nested: { value: 3 } };
            var value4 = { nested: { value: 4 } };
            var baseSnapshot = write_1.write(context, empty, basicQuery, {
                foo: [value1, value2, value3],
            }).snapshot;
            var snapshot = write_1.write(context, baseSnapshot, basicQuery, {
                foo: [value1, value4, value3],
            }).snapshot;
            var baseValue = baseSnapshot.getNodeData(QueryRootId).foo;
            var newValue = snapshot.getNodeData(QueryRootId).foo;
            expect(newValue[0]).to.eq(baseValue[0]);
            expect(newValue[2]).to.eq(baseValue[2]);
            expect(newValue[1]).to.deep.eq({ nested: { value: 4 } });
            expect(baseValue[1]).to.deep.eq({ nested: { value: 2 } });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlVmFsdWVzT2ZBcnJheXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1cGRhdGVWYWx1ZXNPZkFycmF5cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsNkRBQTREO0FBQzVELG9EQUF5RDtBQUN6RCwrQ0FBMEQ7QUFFbEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRiw2RUFBNkU7QUFDN0UsZ0ZBQWdGO0FBQ2hGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBQ2xDLElBQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUVwQyxRQUFRLENBQUMsa0NBQWtDLEVBQUU7UUFFM0MsRUFBRSxDQUFDLHdEQUF3RCxFQUFFO1lBQ25ELElBQUEscUZBQXNCLENBQTJEO1lBQ2pGLElBQUEsd0ZBQVEsQ0FBa0U7WUFFbEYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUN6RixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx5REFBeUQsRUFBRTtZQUM1RCxJQUFNLE1BQU0sR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3hDLElBQU0sTUFBTSxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDeEMsSUFBTSxNQUFNLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNoQyxJQUFBOzt1QkFBc0IsQ0FFM0I7WUFDSyxJQUFBOzt1QkFBUSxDQUViO1lBRUgsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUN6RixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxrQ0FBa0MsRUFBRTtZQUNyQyxJQUFNLE1BQU0sR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3hDLElBQU0sTUFBTSxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDeEMsSUFBTSxNQUFNLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN4QyxJQUFNLE1BQU0sR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2hDLElBQUE7O3VCQUFzQixDQUUzQjtZQUNLLElBQUE7O3VCQUFRLENBRWI7WUFFSCxJQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUM1RCxJQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUN2RCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=