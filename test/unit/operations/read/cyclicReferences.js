"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../src/context");
var GraphSnapshot_1 = require("../../../../src/GraphSnapshot");
var operations_1 = require("../../../../src/operations");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.read", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    describe("cyclic references", function () {
        describe("in a complete cache", function () {
            var cyclicQuery, snapshot;
            beforeAll(function () {
                cyclicQuery = helpers_1.query("{\n          foo {\n            id\n            name\n            bar {\n              id\n              name\n              fizz { id }\n              buzz { id }\n            }\n          }\n        }");
                snapshot = operations_1.write(context, empty, cyclicQuery, {
                    foo: {
                        id: 1,
                        name: 'Foo',
                        bar: {
                            id: 2,
                            name: 'Bar',
                            fizz: { id: 1 },
                            buzz: { id: 2 },
                        },
                    },
                }).snapshot;
            });
            it("can be read", function () {
                var result = operations_1.read(context, cyclicQuery, snapshot).result;
                var foo = result.foo;
                var bar = foo.bar;
                expect(foo.id).to.eq(1);
                expect(foo.name).to.eq('Foo');
                expect(foo.bar).to.eq(bar);
                expect(bar.id).to.eq(2);
                expect(bar.name).to.eq('Bar');
                expect(bar.fizz).to.eq(foo);
                expect(bar.buzz).to.eq(bar);
            });
            it("is marked complete", function () {
                var complete = operations_1.read(context, cyclicQuery, snapshot).complete;
                expect(complete).to.eq(true);
            });
            it("includes all related node ids, if requested", function () {
                var nodeIds = operations_1.read(context, cyclicQuery, snapshot, true).nodeIds;
                expect(Array.from(nodeIds)).to.have.members([QueryRootId, '1', '2']);
            });
        });
        describe("in a partial cache", function () {
            var cyclicQuery, snapshot;
            beforeAll(function () {
                cyclicQuery = helpers_1.query("{\n          foo {\n            id\n            name\n            bar {\n              id\n              name\n              fizz { id }\n              buzz { id }\n            }\n          }\n        }");
                snapshot = operations_1.write(context, empty, cyclicQuery, {
                    foo: {
                        id: 1,
                        name: 'Foo',
                        bar: {
                            id: 2,
                            name: null,
                            fizz: { id: 1 },
                            buzz: { id: 2 },
                        },
                    },
                }).snapshot;
            });
            it("can be read", function () {
                var result = operations_1.read(context, cyclicQuery, snapshot).result;
                var foo = result.foo;
                var bar = foo.bar;
                expect(foo.id).to.eq(1);
                expect(foo.name).to.eq('Foo');
                expect(foo.bar).to.eq(bar);
                expect(bar.id).to.eq(2);
                expect(bar.name).to.eq(null);
                expect(bar.fizz).to.eq(foo);
                expect(bar.buzz).to.eq(bar);
            });
            it("is marked complete", function () {
                var complete = operations_1.read(context, cyclicQuery, snapshot).complete;
                expect(complete).to.eq(true);
            });
            it("includes all related node ids, if requested", function () {
                var nodeIds = operations_1.read(context, cyclicQuery, snapshot, true).nodeIds;
                expect(Array.from(nodeIds)).to.have.members([QueryRootId, '1', '2']);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3ljbGljUmVmZXJlbmNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImN5Y2xpY1JlZmVyZW5jZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtREFBdUQ7QUFDdkQsK0RBQThEO0FBQzlELHlEQUF5RDtBQUN6RCxpREFBb0U7QUFDcEUsNENBQXVEO0FBRS9DLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxpQkFBaUIsRUFBRTtJQUUxQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBRWxDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRTtRQUM1QixRQUFRLENBQUMscUJBQXFCLEVBQUU7WUFFOUIsSUFBSSxXQUF5QixFQUFFLFFBQXVCLENBQUM7WUFDdkQsU0FBUyxDQUFDO2dCQUNSLFdBQVcsR0FBRyxlQUFLLENBQUMsNE1BV2xCLENBQUMsQ0FBQztnQkFFSixRQUFRLEdBQUcsa0JBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTtvQkFDNUMsR0FBRyxFQUFFO3dCQUNILEVBQUUsRUFBRSxDQUFDO3dCQUNMLElBQUksRUFBRSxLQUFLO3dCQUNYLEdBQUcsRUFBRTs0QkFDSCxFQUFFLEVBQUUsQ0FBQzs0QkFDTCxJQUFJLEVBQUUsS0FBSzs0QkFDWCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFOzRCQUNmLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7eUJBQ2hCO3FCQUNGO2lCQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDZCxDQUFDLENBQUMsQ0FBQztZQUVILEVBQUUsQ0FBQyxhQUFhLEVBQUU7Z0JBQ1IsSUFBQSxpRUFBTSxDQUEwQztnQkFDeEQsSUFBTSxHQUFHLEdBQUksTUFBYyxDQUFDLEdBQUcsQ0FBQztnQkFDaEMsSUFBTSxHQUFHLEdB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