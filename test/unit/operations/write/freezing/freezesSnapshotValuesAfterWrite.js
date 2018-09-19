"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var write_1 = require("../../../../../src/operations/write");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.write", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    describe("freezes snapshot values after write operation", function () {
        it("checks values referenced from the snapshot", function () {
            var nestedQuery = helpers_1.query("{\n        foo {\n          bar {\n            baz\n          }\n        }\n      }");
            var snapshot = write_1.write(context, empty, nestedQuery, {
                foo: {
                    bar: [
                        { baz: 123 },
                        { baz: 321 },
                    ],
                },
            }).snapshot;
            expect(function () {
                var root = snapshot.getNodeData(QueryRootId);
                root.foo.bar[0].baz = 111;
            }).to.throw(/property.*baz/);
            expect(function () {
                var root = snapshot.getNodeData(QueryRootId);
                root.foo.fizz = 'nope';
            }).to.throw(/property.*fizz/);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJlZXplc1NuYXBzaG90VmFsdWVzQWZ0ZXJXcml0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZyZWV6ZXNTbmFwc2hvdFZhbHVlc0FmdGVyV3JpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzREFBMEQ7QUFDMUQsa0VBQWlFO0FBQ2pFLDZEQUE0RDtBQUM1RCxvREFBeUQ7QUFDekQsK0NBQTBEO0FBRWxELElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBRWxDLFFBQVEsQ0FBQywrQ0FBK0MsRUFBRTtRQUV4RCxFQUFFLENBQUMsNENBQTRDLEVBQUU7WUFDL0MsSUFBTSxXQUFXLEdBQUcsZUFBSyxDQUFDLHFGQU14QixDQUFDLENBQUM7WUFFSixJQUFNLFFBQVEsR0FBRyxhQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7Z0JBQ2xELEdBQUcsRUFBRTtvQkFDSCxHQUFHLEVBQUU7d0JBQ0gsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO3dCQUNaLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtxQkFDYjtpQkFDRjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFFWixNQUFNLENBQUM7Z0JBQ0wsSUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRTdCLE1BQU0sQ0FBQztnQkFDTCxJQUFNLElBQUksR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7WUFDekIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9