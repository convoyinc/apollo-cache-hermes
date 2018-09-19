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
    var basicNestedQuery = helpers_1.query("{ foo { a b c } }");
    describe("minimal updates values of objects", function () {
        it("preserves objects if none of their values change", function () {
            var baseSnapshot = write_1.write(context, empty, basicNestedQuery, {
                foo: { a: 1, b: 2, c: 3 },
            }).snapshot;
            var snapshot = write_1.write(context, baseSnapshot, basicNestedQuery, {
                foo: { a: 1, b: 2, c: 3 },
            }).snapshot;
            expect(snapshot.getNodeData(QueryRootId)).to.eq(baseSnapshot.getNodeData(QueryRootId));
        });
        it("only edits values that do change", function () {
            var value1 = { nested: { value: 1 } };
            var value2 = { nested: { value: 2 } };
            var value3 = { nested: { value: 3 } };
            var value4 = { nested: { value: 4 } };
            var baseSnapshot = write_1.write(context, empty, basicNestedQuery, {
                foo: { a: value1, b: value2, c: value3 },
            }).snapshot;
            var snapshot = write_1.write(context, baseSnapshot, basicNestedQuery, {
                foo: { a: value1, b: value4, c: value3 },
            }).snapshot;
            var baseValue = baseSnapshot.getNodeData(QueryRootId).foo;
            var newValue = snapshot.getNodeData(QueryRootId).foo;
            expect(newValue.a).to.eq(baseValue.a);
            expect(newValue.c).to.eq(baseValue.c);
            expect(newValue.b).to.deep.eq({ nested: { value: 4 } });
            expect(baseValue.b).to.deep.eq({ nested: { value: 2 } });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlVmFsdWVzT2ZPYmplY3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidXBkYXRlVmFsdWVzT2ZPYmplY3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0RBQTBEO0FBQzFELGtFQUFpRTtBQUNqRSw2REFBNEQ7QUFDNUQsb0RBQXlEO0FBQ3pELCtDQUEwRDtBQUVsRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBRTNCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFDbEMsSUFBTSxnQkFBZ0IsR0FBRyxlQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUVwRCxRQUFRLENBQUMsbUNBQW1DLEVBQUU7UUFFNUMsRUFBRSxDQUFDLGtEQUFrRCxFQUFFO1lBQzdDLElBQUE7O3VCQUFzQixDQUUzQjtZQUNLLElBQUE7O3VCQUFRLENBRWI7WUFFSCxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGtDQUFrQyxFQUFFO1lBQ3JDLElBQU0sTUFBTSxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDeEMsSUFBTSxNQUFNLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN4QyxJQUFNLE1BQU0sR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3hDLElBQU0sTUFBTSxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDaEMsSUFBQTs7dUJBQXNCLENBRTNCO1lBQ0ssSUFBQTs7dUJBQVEsQ0FFYjtZQUVILElBQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQzVELElBQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==