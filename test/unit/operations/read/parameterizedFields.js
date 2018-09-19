"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../src/context");
var GraphSnapshot_1 = require("../../../../src/GraphSnapshot");
var operations_1 = require("../../../../src/operations");
var helpers_1 = require("../../../helpers");
describe("operations.read", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    var parameterizedQuery = helpers_1.query("\n    query getAFoo($id: ID!) {\n      user(id: $id, withExtra: true) {\n        id name extra\n      }\n      stuff\n    }\n  ", { id: 1 });
    describe("parameterized fields", function () {
        describe("with a complete cache", function () {
            var snapshot;
            beforeAll(function () {
                snapshot = operations_1.write(context, empty, parameterizedQuery, {
                    user: { id: 1, name: 'Foo', extra: true },
                    stuff: 123,
                }).snapshot;
            });
            it("returns the selected values, overlaid on the underlying data", function () {
                var result = operations_1.read(context, parameterizedQuery, snapshot).result;
                expect(result).to.deep.equal({
                    user: { id: 1, name: 'Foo', extra: true },
                    stuff: 123,
                });
            });
        });
        describe("with nested fields", function () {
            var nestedQuery = helpers_1.query("query nested($id: ID!) {\n        one {\n          two(id: $id) {\n            id\n            three {\n              four(extra: true) {\n                five\n              }\n            }\n          }\n        }\n      }", { id: 1 });
            describe("and a full store", function () {
                var snapshot;
                beforeAll(function () {
                    snapshot = operations_1.write(context, empty, nestedQuery, {
                        one: {
                            two: [
                                {
                                    id: 1,
                                    three: {
                                        four: { five: 1 },
                                    },
                                },
                                {
                                    id: 2,
                                    three: {
                                        four: { five: 2 },
                                    },
                                },
                            ],
                        },
                    }).snapshot;
                });
                it("returns the selected values, overlaid on the underlying data", function () {
                    var result = operations_1.read(context, nestedQuery, snapshot).result;
                    expect(result).to.deep.equal({
                        one: {
                            two: [
                                {
                                    id: 1,
                                    three: {
                                        four: { five: 1 },
                                    },
                                },
                                {
                                    id: 2,
                                    three: {
                                        four: { five: 2 },
                                    },
                                },
                            ],
                        },
                    });
                });
            });
            describe("and an empty store", function () {
                it("doesn't recurse to nested fields if there are no values for their parent", function () {
                    var result = operations_1.read(context, nestedQuery, empty).result;
                    expect(result).to.deep.equal(undefined);
                });
                it("is marked incomplete", function () {
                    var complete = operations_1.read(context, nestedQuery, empty).complete;
                    expect(complete).to.eq(false);
                });
            });
            describe("and an empty value", function () {
                var snapshot;
                beforeAll(function () {
                    snapshot = operations_1.write(context, empty, nestedQuery, {
                        one: {
                            two: [
                                {
                                    id: 1,
                                    three: {
                                        four: [],
                                    },
                                },
                            ],
                        },
                    }).snapshot;
                });
                it("returns the selected values, overlaid on the underlying data", function () {
                    var result = operations_1.read(context, nestedQuery, snapshot).result;
                    expect(result).to.deep.equal({
                        one: {
                            two: [
                                {
                                    id: 1,
                                    three: {
                                        four: [],
                                    },
                                },
                            ],
                        },
                    });
                });
            });
            describe("and a null container", function () {
                var snapshot;
                beforeAll(function () {
                    snapshot = operations_1.write(context, empty, nestedQuery, { one: null }).snapshot;
                });
                it("returns the selected values, overlaid on the underlying data", function () {
                    var result = operations_1.read(context, nestedQuery, snapshot).result;
                    expect(result).to.deep.equal({ one: null });
                });
                it("is marked complete", function () {
                    var complete = operations_1.read(context, nestedQuery, snapshot).complete;
                    expect(complete).to.eq(true);
                });
            });
            describe("and a null root snapshot", function () {
                var snapshot;
                beforeAll(function () {
                    snapshot = operations_1.write(context, empty, nestedQuery, {
                        one: {
                            two: null,
                        },
                    }).snapshot;
                });
                it("returns the selected values, overlaid on the underlying data", function () {
                    var result = operations_1.read(context, nestedQuery, snapshot).result;
                    expect(result).to.deep.equal({
                        one: {
                            two: null,
                        },
                    });
                });
                it("is marked complete", function () {
                    var complete = operations_1.read(context, nestedQuery, snapshot).complete;
                    expect(complete).to.eq(true);
                });
            });
            describe("and a null intermediate node", function () {
                var snapshot;
                beforeAll(function () {
                    snapshot = operations_1.write(context, empty, nestedQuery, {
                        one: {
                            two: {
                                id: 1,
                                three: null,
                            },
                        },
                    }).snapshot;
                });
                it("returns the selected values, overlaid on the underlying data", function () {
                    var result = operations_1.read(context, nestedQuery, snapshot).result;
                    expect(result).to.deep.equal({
                        one: {
                            two: {
                                id: 1,
                                three: null,
                            },
                        },
                    });
                });
                it("is marked complete", function () {
                    var complete = operations_1.read(context, nestedQuery, snapshot).complete;
                    expect(complete).to.eq(true);
                });
            });
            describe("in an array with holes", function () {
                var snapshot;
                beforeAll(function () {
                    snapshot = operations_1.write(context, empty, nestedQuery, {
                        one: [
                            null,
                            {
                                two: {
                                    id: 1,
                                    three: null,
                                },
                            },
                        ],
                    }).snapshot;
                });
                it("returns the selected values, overlaid on the underlying data", function () {
                    var result = operations_1.read(context, nestedQuery, snapshot).result;
                    expect(result).to.deep.equal({
                        one: [
                            null,
                            {
                                two: {
                                    id: 1,
                                    three: null,
                                },
                            },
                        ],
                    });
                });
                it("is marked complete", function () {
                    var complete = operations_1.read(context, nestedQuery, snapshot).complete;
                    expect(complete).to.eq(true);
                });
            });
        });
        describe("directly nested reference fields", function () {
            var nestedQuery = helpers_1.query("\n      query nested($id: ID!) {\n        one(id: $id) {\n          id\n          two(extra: true) {\n            id\n          }\n        }\n      }", { id: 1 });
            var snapshot;
            beforeAll(function () {
                snapshot = operations_1.write(context, empty, nestedQuery, {
                    one: {
                        id: 1,
                        two: { id: 2 },
                    },
                }).snapshot;
            });
            it("returns the selected values, overlaid on the underlying data", function () {
                var result = operations_1.read(context, nestedQuery, snapshot).result;
                expect(result).to.deep.equal({
                    one: {
                        id: 1,
                        two: { id: 2 },
                    },
                });
            });
        });
        describe("with a value of []", function () {
            var snapshot;
            beforeAll(function () {
                snapshot = operations_1.write(context, empty, parameterizedQuery, {
                    user: [],
                    stuff: 123,
                }).snapshot;
            });
            it("returns the selected values, overlaid on the underlying data", function () {
                var result = operations_1.read(context, parameterizedQuery, snapshot).result;
                expect(result).to.deep.equal({
                    user: [],
                    stuff: 123,
                });
            });
        });
    });
    describe("with @static fields", function () {
        var staticQuery = helpers_1.query("{\n      todos {\n        id\n        value: rawValue @static\n        history(limit: 2) @static {\n          changeType\n          value\n        }\n      }\n    }");
        var otherStaticQuery = helpers_1.query("{\n      todos {\n        id\n        value: rawValue @static\n        history(limit: 2) @static {\n          value\n        }\n      }\n    }");
        var snapshot;
        beforeAll(function () {
            snapshot = operations_1.write(context, empty, staticQuery, {
                todos: [
                    {
                        id: 1,
                        value: 'hello',
                        history: [
                            {
                                changeType: 'edit',
                                value: 'ohai',
                            },
                            {
                                changeType: 'edit',
                                value: 'hey',
                            },
                        ],
                    },
                ],
            }).snapshot;
        });
        it("can be read", function () {
            var result = operations_1.read(context, staticQuery, snapshot).result;
            expect(result).to.deep.equal({
                todos: [
                    {
                        id: 1,
                        value: 'hello',
                        history: [
                            {
                                changeType: 'edit',
                                value: 'ohai',
                            },
                            {
                                changeType: 'edit',
                                value: 'hey',
                            },
                        ],
                    },
                ],
            });
        });
        it("is the same object between reads", function () {
            var result1 = operations_1.read(context, staticQuery, snapshot).result;
            var result2 = operations_1.read(context, otherStaticQuery, snapshot).result;
            expect(result1).to.eq(result2);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVyaXplZEZpZWxkcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBhcmFtZXRlcml6ZWRGaWVsZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtREFBdUQ7QUFDdkQsK0RBQThEO0FBQzlELHlEQUF5RDtBQUN6RCw0Q0FBdUQ7QUFFdkQsUUFBUSxDQUFDLGlCQUFpQixFQUFFO0lBRTFCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFDbEMsSUFBTSxrQkFBa0IsR0FBRyxlQUFLLENBQUMsaUlBT2hDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUVkLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRTtRQUUvQixRQUFRLENBQUMsdUJBQXVCLEVBQUU7WUFFaEMsSUFBSSxRQUF1QixDQUFDO1lBQzVCLFNBQVMsQ0FBQztnQkFDUixRQUFRLEdBQUcsa0JBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFO29CQUNuRCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtvQkFDekMsS0FBSyxFQUFFLEdBQUc7aUJBQ1gsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1lBRUgsRUFBRSxDQUFDLDhEQUE4RCxFQUFFO2dCQUN6RCxJQUFBLHdFQUFNLENBQWlEO2dCQUMvRCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7b0JBQzNCLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO29CQUN6QyxLQUFLLEVBQUUsR0FBRztpQkFDWCxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUVMLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLG9CQUFvQixFQUFFO1lBRTdCLElBQU0sV0FBVyxHQUFHLGVBQUssQ0FBQyxrT0FXeEIsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRWYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO2dCQUUzQixJQUFJLFFBQXVCLENBQUM7Z0JBQzVCLFNBQVMsQ0FBQztvQkFDUixRQUFRLEdBQUcsa0JBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTt3QkFDNUMsR0FBRyxFQUFFOzRCQUNILEdBQUcsRUFBRTtnQ0FDSDtvQ0FDRSxFQUFFLEVBQUUsQ0FBQztvQ0FDTCxLQUFLLEVBQUU7d0NBQ0wsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTtxQ0FDbEI7aUNBQ0Y7Z0NBQ0Q7b0NBQ0UsRUFBRSxFQUFFLENBQUM7b0NBQ0wsS0FBSyxFQUFFO3dDQUNMLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7cUNBQ2xCO2lDQUNGOzZCQUNGO3lCQUNGO3FCQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsRUFBRSxDQUFDLDhEQUE4RCxFQUFFO29CQUN6RCxJQUFBLGlFQUFNLENBQTBDO29CQUN4RCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7d0JBQzNCLEdBQUcsRUFBRTs0QkFDSCxHQUFHLEVBQUU7Z0NBQ0g7b0NBQ0UsRUFBRSxFQUFFLENBQUM7b0NBQ0wsS0FBSyxFQUFFO3dDQUNMLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7cUNBQ2xCO2lDQUNGO2dDQUNEO29DQUNFLEVBQUUsRUFBRSxDQUFDO29DQUNMLEtBQUssRUFBRTt3Q0FDTCxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO3FDQUNsQjtpQ0FDRjs2QkFDRjt5QkFDRjtxQkFDRixDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFTCxDQUFDLENBQUMsQ0FBQztZQUVILFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtnQkFFN0IsRUFBRSxDQUFDLDBFQUEwRSxFQUFFO29CQUNyRSxJQUFBLDhEQUFNLENBQXVDO29CQUNyRCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzFDLENBQUMsQ0FBQyxDQUFDO2dCQUVILEVBQUUsQ0FBQyxzQkFBc0IsRUFBRTtvQkFDakIsSUFBQSxrRUFBUSxDQUF1QztvQkFDdkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLENBQUMsQ0FBQyxDQUFDO1lBRUwsQ0FBQyxDQUFDLENBQUM7WUFFSCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7Z0JBRTdCLElBQUksUUFBdUIsQ0FBQztnQkFDNUIsU0FBUyxDQUFDO29CQUNSLFFBQVEsR0FBRyxrQkFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFO3dCQUM1QyxHQUFHLEVBQUU7NEJBQ0gsR0FBRyxFQUFFO2dDQUNIO29DQUNFLEVBQUUsRUFBRSxDQUFDO29DQUNMLEtBQUssRUFBRTt3Q0FDTCxJQUFJLEVBQUUsRUFBRTtxQ0FDVDtpQ0FDRjs2QkFDRjt5QkFDRjtxQkFDRixDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxDQUFDO2dCQUVILEVBQUUsQ0FBQyw4REFBOEQsRUFBRTtvQkFDekQsSUFBQSxpRUFBTSxDQUEwQztvQkFDeEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO3dCQUMzQixHQUFHLEVBQUU7NEJBQ0gsR0FBRyxFQUFFO2dDQUNIO29DQUNFLEVBQUUsRUFBRSxDQUFDO29DQUNMLEtBQUssRUFBRTt3Q0FDTCxJQUFJLEVBQUUsRUFBRTtxQ0FDVDtpQ0FDRjs2QkFDRjt5QkFDRjtxQkFDRixDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFTCxDQUFDLENBQUMsQ0FBQztZQUVILFFBQVEsQ0FBQyxzQkFBc0IsRUFBRTtnQkFFL0IsSUFBSSxRQUF1QixDQUFDO2dCQUM1QixTQUFTLENBQUM7b0JBQ1IsUUFBUSxHQUFHLGtCQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBQ3hFLENBQUMsQ0FBQyxDQUFDO2dCQUVILEVBQUUsQ0FBQyw4REFBOEQsRUFBRTtvQkFDekQsSUFBQSxpRUFBTSxDQUEwQztvQkFDeEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQzlDLENBQUMsQ0FBQyxDQUFDO2dCQUVILEVBQUUsQ0FBQyxvQkFBb0IsRUFBRTtvQkFDZixJQUFBLHFFQUFRLENBQTBDO29CQUMxRCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDL0IsQ0FBQyxDQUFDLENBQUM7WUFFTCxDQUFDLENBQUMsQ0FBQztZQUVILFFBQVEsQ0FBQywwQkFBMEIsRUFBRTtnQkFFbkMsSUFBSSxRQUF1QixDQUFDO2dCQUM1QixTQUFTLENBQUM7b0JBQ1IsUUFBUSxHQUFHLGtCQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7d0JBQzVDLEdBQUcsRUFBRTs0QkFDSCxHQUFHLEVBQUUsSUFBSTt5QkFDVjtxQkFDRixDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxDQUFDO2dCQUVILEVBQUUsQ0FBQyw4REFBOEQsRUFBRTtvQkFDekQsSUFBQSxpRUFBTSxDQUEwQztvQkFDeEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO3dCQUMzQixHQUFHLEVBQUU7NEJBQ0gsR0FBRyxFQUFFLElBQUk7eUJBQ1Y7cUJBQ0YsQ0FBQyxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUVILEVBQUUsQ0FBQyxvQkFBb0IsRUFBRTtvQkFDZixJQUFBLHFFQUFRLENBQTBDO29CQUMxRCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDL0IsQ0FBQyxDQUFDLENBQUM7WUFFTCxDQUFDLENBQUMsQ0FBQztZQUVILFFBQVEsQ0FBQyw4QkFBOEIsRUFBRTtnQkFFdkMsSUFBSSxRQUF1QixDQUFDO2dCQUM1QixTQUFTLENBQUM7b0JBQ1IsUUFBUSxHQUFHLGtCQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7d0JBQzVDLEdBQUcsRUFBRTs0QkFDSCxHQUFHLEVBQUU7Z0NBQ0gsRUFBRSxFQUFFLENBQUM7Z0NBQ0wsS0FBSyxFQUFFLElBQUk7NkJBQ1o7eUJBQ0Y7cUJBQ0YsQ0FBQyxDQUFDLFFBQVEsQ0FBQztnQkFDZCxDQUFDLENBQUMsQ0FBQztnQkFFSCxFQUFFLENBQUMsOERBQThELEVBQUU7b0JBQ3pELElBQUEsaUVBQU0sQ0FBMEM7b0JBQ3hELE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQzt3QkFDM0IsR0FBRyxFQUFFOzRCQUNILEdBQUcsRUFBRTtnQ0FDSCxFQUFFLEVBQUUsQ0FBQztnQ0FDTCxLQUFLLEVBQUUsSUFBSTs2QkFDWjt5QkFDRjtxQkFDRixDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsRUFBRSxDQUFDLG9CQUFvQixFQUFFO29CQUNmLElBQUEscUVBQVEsQ0FBMEM7b0JBQzFELE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMvQixDQUFDLENBQUMsQ0FBQztZQUVMLENBQUMsQ0FBQyxDQUFDO1lBRUgsUUFBUSxDQUFDLHdCQUF3QixFQUFFO2dCQUVqQyxJQUFJLFFBQXVCLENBQUM7Z0JBQzVCLFNBQVMsQ0FBQztvQkFDUixRQUFRLEdBQUcsa0JBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTt3QkFDNUMsR0FBRyxFQUFFOzRCQUNILElBQUk7NEJBQ0o7Z0NBQ0UsR0FBRyxFQUFFO29DQUNILEVBQUUsRUFBRSxDQUFDO29DQUNMLEtBQUssRUFBRSxJQUFJO2lDQUNaOzZCQUNGO3lCQUNGO3FCQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsRUFBRSxDQUFDLDhEQUE4RCxFQUFFO29CQUN6RCxJQUFBLGlFQUFNLENBQTBDO29CQUN4RCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7d0JBQzNCLEdBQUcsRUFBRTs0QkFDSCxJQUFJOzRCQUNKO2dDQUNFLEdBQUcsRUFBRTtvQ0FDSCxFQUFFLEVBQUUsQ0FBQztvQ0FDTCxLQUFLLEVBQUUsSUFBSTtpQ0FDWjs2QkFDRjt5QkFDRjtxQkFDRixDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsRUFBRSxDQUFDLG9CQUFvQixFQUFFO29CQUNmLElBQUEscUVBQVEsQ0FBMEM7b0JBQzFELE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMvQixDQUFDLENBQUMsQ0FBQztZQUVMLENBQUMsQ0FBQyxDQUFDO1FBRUwsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsa0NBQWtDLEVBQUU7WUFFM0MsSUFBTSxXQUFXLEdBQUcsZUFBSyxDQUFDLHVKQVF4QixFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFZixJQUFJLFFBQXVCLENBQUM7WUFDNUIsU0FBUyxDQUFDO2dCQUNSLFFBQVEsR0FBRyxrQkFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFO29CQUM1QyxHQUFHLEVBQUU7d0JBQ0gsRUFBRSxFQUFFLENBQUM7d0JBQ0wsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtxQkFDZjtpQkFDRixDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMsOERBQThELEVBQUU7Z0JBQ3pELElBQUEsaUVBQU0sQ0FBMEM7Z0JBQ3hELE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztvQkFDM0IsR0FBRyxFQUFFO3dCQUNILEVBQUUsRUFBRSxDQUFDO3dCQUNMLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7cUJBQ2Y7aUJBQ0YsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFTCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtZQUU3QixJQUFJLFFBQXVCLENBQUM7WUFDNUIsU0FBUyxDQUFDO2dCQUNSLFFBQVEsR0FBRyxrQkFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUU7b0JBQ25ELElBQUksRUFBRSxFQUFFO29CQUNSLEtBQUssRUFBRSxHQUFHO2lCQUNYLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDZCxDQUFDLENBQUMsQ0FBQztZQUVILEVBQUUsQ0FBQyw4REFBOEQsRUFBRTtnQkFDekQsSUFBQSx3RUFBTSxDQUFpRDtnQkFDL0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO29CQUMzQixJQUFJLEVBQUUsRUFBRTtvQkFDUixLQUFLLEVBQUUsR0FBRztpQkFDWCxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUVMLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMscUJBQXFCLEVBQUU7UUFFOUIsSUFBTSxXQUFXLEdBQUcsZUFBSyxDQUFDLHNLQVN4QixDQUFDLENBQUM7UUFFSixJQUFNLGdCQUFnQixHQUFHLGVBQUssQ0FBQyxnSkFRN0IsQ0FBQyxDQUFDO1FBRUosSUFBSSxRQUF1QixDQUFDO1FBQzVCLFNBQVMsQ0FBQztZQUNSLFFBQVEsR0FBRyxrQkFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFO2dCQUM1QyxLQUFLLEVBQUU7b0JBQ0w7d0JBQ0UsRUFBRSxFQUFFLENBQUM7d0JBQ0wsS0FBSyxFQUFFLE9BQU87d0JBQ2QsT0FBTyxFQUFFOzRCQUNQO2dDQUNFLFVBQVUsRUFBRSxNQUFNO2dDQUNsQixLQUFLLEVBQUUsTUFBTTs2QkFDZDs0QkFDRDtnQ0FDRSxVQUFVLEVBQUUsTUFBTTtnQ0FDbEIsS0FBSyxFQUFFLEtBQUs7NkJBQ2I7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7YUFDRixDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsYUFBYSxFQUFFO1lBQ1IsSUFBQSxpRUFBTSxDQUEwQztZQUN4RCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQzNCLEtBQUssRUFBRTtvQkFDTDt3QkFDRSxFQUFFLEVBQUUsQ0FBQzt3QkFDTCxLQUFLLEVBQUUsT0FBTzt3QkFDZCxPQUFPLEVBQUU7NEJBQ1A7Z0NBQ0UsVUFBVSxFQUFFLE1BQU07Z0NBQ2xCLEtBQUssRUFBRSxNQUFNOzZCQUNkOzRCQUNEO2dDQUNFLFVBQVUsRUFBRSxNQUFNO2dDQUNsQixLQUFLLEVBQUUsS0FBSzs2QkFDYjt5QkFDRjtxQkFDRjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGtDQUFrQyxFQUFFO1lBQ3JDLElBQU0sT0FBTyxHQUFHLGlCQUFJLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDNUQsSUFBTSxPQUFPLEdBQUcsaUJBQUksQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDO1lBRWpFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9