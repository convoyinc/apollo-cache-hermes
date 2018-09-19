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
    var silentContext = new context_1.CacheContext(helpers_1.silentConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    var viewerQuery = helpers_1.query("{\n    viewer {\n      id\n      name\n    }\n  }");
    describe("with an empty cache", function () {
        it("returns undefined when fetching anything.", function () {
            expect(operations_1.read(context, viewerQuery, empty).result).to.eq(undefined);
        });
        it("is marked incomplete", function () {
            expect(operations_1.read(context, viewerQuery, empty).complete).to.eq(false);
        });
        it("includes no node ids if requested", function () {
            expect(Array.from(operations_1.read(context, viewerQuery, empty, true).nodeIds)).to.have.members([]);
        });
    });
    describe("with a complete cache", function () {
        var snapshot;
        beforeAll(function () {
            snapshot = operations_1.write(context, empty, viewerQuery, {
                viewer: {
                    id: 123,
                    name: 'Foo Bar',
                },
            }).snapshot;
        });
        it("returns the selected values.", function () {
            var result = operations_1.read(context, viewerQuery, snapshot).result;
            expect(result).to.deep.eq({
                viewer: {
                    id: 123,
                    name: 'Foo Bar',
                },
            });
        });
        it("is marked complete", function () {
            var complete = operations_1.read(context, viewerQuery, snapshot).complete;
            expect(complete).to.eq(true);
        });
        it("includes all related node ids, if requested", function () {
            var nodeIds = operations_1.read(context, viewerQuery, snapshot, true).nodeIds;
            expect(Array.from(nodeIds)).to.have.members([QueryRootId, '123']);
        });
    });
    describe("with a partial write", function () {
        var snapshot;
        beforeAll(function () {
            snapshot = operations_1.write(silentContext, empty, viewerQuery, {
                viewer: {
                    id: 123,
                },
            }).snapshot;
        });
        it("returns the selected values.", function () {
            var result = operations_1.read(silentContext, viewerQuery, snapshot).result;
            expect(result).to.deep.eq({
                viewer: {
                    id: 123,
                    name: null,
                },
            });
        });
        it("is marked incomplete", function () {
            var complete = operations_1.read(silentContext, viewerQuery, snapshot).complete;
            expect(complete).to.eq(true);
        });
        it("includes all related node ids, if requested", function () {
            var nodeIds = operations_1.read(silentContext, viewerQuery, snapshot, true).nodeIds;
            expect(Array.from(nodeIds)).to.have.members([QueryRootId, '123']);
        });
    });
    describe("with a null subgraphs", function () {
        var nestedQuery, snapshot;
        beforeAll(function () {
            nestedQuery = helpers_1.query("{\n        one {\n          two {\n            three { four }\n          }\n          five\n        }\n      }");
            snapshot = operations_1.write(context, empty, nestedQuery, {
                one: {
                    two: null,
                    five: 'hi',
                },
            }).snapshot;
        });
        it("returns the selected values.", function () {
            var result = operations_1.read(context, nestedQuery, snapshot).result;
            expect(result).to.deep.eq({
                one: {
                    two: null,
                    five: 'hi',
                },
            });
        });
        it("is marked complete", function () {
            var complete = operations_1.read(context, nestedQuery, snapshot).complete;
            expect(complete).to.eq(true);
        });
        it("includes all related node ids, if requested", function () {
            var nodeIds = operations_1.read(context, nestedQuery, snapshot, true).nodeIds;
            expect(Array.from(nodeIds)).to.have.members([QueryRootId]);
        });
    });
    describe("with arrays of complete values", function () {
        var snapshot;
        beforeAll(function () {
            snapshot = operations_1.write(context, empty, viewerQuery, {
                viewer: [
                    { id: 1, name: 'Foo' },
                    { id: 2, name: 'Bar' },
                    { id: 3, name: 'Baz' },
                ],
            }).snapshot;
        });
        it("returns the selected values.", function () {
            var result = operations_1.read(context, viewerQuery, snapshot).result;
            expect(result).to.deep.eq({
                viewer: [
                    { id: 1, name: 'Foo' },
                    { id: 2, name: 'Bar' },
                    { id: 3, name: 'Baz' },
                ],
            });
        });
        it("is marked complete", function () {
            var complete = operations_1.read(context, viewerQuery, snapshot).complete;
            expect(complete).to.eq(true);
        });
        it("includes all related node ids, if requested", function () {
            var nodeIds = operations_1.read(context, viewerQuery, snapshot, true).nodeIds;
            expect(Array.from(nodeIds)).to.have.members([QueryRootId, '1', '2', '3']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9EeW5hbWljRmVhdHVyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJub0R5bmFtaWNGZWF0dXJlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1EQUF1RDtBQUN2RCwrREFBOEQ7QUFDOUQseURBQXlEO0FBQ3pELGlEQUFvRTtBQUNwRSw0Q0FBcUU7QUFFN0QsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLGlCQUFpQixFQUFFO0lBRTFCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxhQUFhLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUNyRCxJQUFNLEtBQUssR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztJQUNsQyxJQUFNLFdBQVcsR0FBRyxlQUFLLENBQUMsbURBS3hCLENBQUMsQ0FBQztJQUVKLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRTtRQUU5QixFQUFFLENBQUMsMkNBQTJDLEVBQUU7WUFDOUMsTUFBTSxDQUFDLGlCQUFJLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHNCQUFzQixFQUFFO1lBQ3pCLE1BQU0sQ0FBQyxpQkFBSSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsRSxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRTtZQUN0QyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxpQkFBSSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUYsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyx1QkFBdUIsRUFBRTtRQUVoQyxJQUFJLFFBQXVCLENBQUM7UUFDNUIsU0FBUyxDQUFDO1lBQ1IsUUFBUSxHQUFHLGtCQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7Z0JBQzVDLE1BQU0sRUFBRTtvQkFDTixFQUFFLEVBQUUsR0FBRztvQkFDUCxJQUFJLEVBQUUsU0FBUztpQkFDaEI7YUFDRixDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsOEJBQThCLEVBQUU7WUFDekIsSUFBQSxpRUFBTSxDQUEwQztZQUN4RCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sRUFBRTtvQkFDTixFQUFFLEVBQUUsR0FBRztvQkFDUCxJQUFJLEVBQUUsU0FBUztpQkFDaEI7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQkFBb0IsRUFBRTtZQUNmLElBQUEscUVBQVEsQ0FBMEM7WUFDMUQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUU7WUFDeEMsSUFBQSx5RUFBTyxDQUFnRDtZQUMvRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxzQkFBc0IsRUFBRTtRQUUvQixJQUFJLFFBQXVCLENBQUM7UUFDNUIsU0FBUyxDQUFDO1lBQ1IsUUFBUSxHQUFHLGtCQUFLLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7Z0JBQ2xELE1BQU0sRUFBRTtvQkFDTixFQUFFLEVBQUUsR0FBRztpQkFDUjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw4QkFBOEIsRUFBRTtZQUN6QixJQUFBLHVFQUFNLENBQWdEO1lBQzlELE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxFQUFFO29CQUNOLEVBQUUsRUFBRSxHQUFHO29CQUNQLElBQUksRUFBRSxJQUFJO2lCQUNYO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsc0JBQXNCLEVBQUU7WUFDakIsSUFBQSwyRUFBUSxDQUFnRDtZQUNoRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRTtZQUN4QyxJQUFBLCtFQUFPLENBQXNEO1lBQ3JFLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNwRSxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHVCQUF1QixFQUFFO1FBRWhDLElBQUksV0FBeUIsRUFBRSxRQUF1QixDQUFDO1FBQ3ZELFNBQVMsQ0FBQztZQUNSLFdBQVcsR0FBRyxlQUFLLENBQUMsZ0hBT2xCLENBQUMsQ0FBQztZQUNKLFFBQVEsR0FBRyxrQkFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFO2dCQUM1QyxHQUFHLEVBQUU7b0JBQ0gsR0FBRyxFQUFFLElBQUk7b0JBQ1QsSUFBSSxFQUFFLElBQUk7aUJBQ1g7YUFDRixDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsOEJBQThCLEVBQUU7WUFDekIsSUFBQSxpRUFBTSxDQUEwQztZQUN4RCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLEdBQUcsRUFBRTtvQkFDSCxHQUFHLEVBQUUsSUFBSTtvQkFDVCxJQUFJLEVBQUUsSUFBSTtpQkFDWDthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9CQUFvQixFQUFFO1lBQ2YsSUFBQSxxRUFBUSxDQUEwQztZQUMxRCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRTtZQUN4QyxJQUFBLHlFQUFPLENBQWdEO1lBQy9ELE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQzdELENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZ0NBQWdDLEVBQUU7UUFFekMsSUFBSSxRQUF1QixDQUFDO1FBQzVCLFNBQVMsQ0FBQztZQUNSLFFBQVEsR0FBRyxrQkFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFO2dCQUM1QyxNQUFNLEVBQUU7b0JBQ04sRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7b0JBQ3RCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO29CQUN0QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtpQkFDdkI7YUFDRixDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsOEJBQThCLEVBQUU7WUFDekIsSUFBQSxpRUFBTSxDQUEwQztZQUN4RCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sRUFBRTtvQkFDTixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtvQkFDdEIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7b0JBQ3RCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO2lCQUN2QjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9CQUFvQixFQUFFO1lBQ2YsSUFBQSxxRUFBUSxDQUEwQztZQUMxRCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRTtZQUN4QyxJQUFBLHlFQUFPLENBQWdEO1lBQy9ELE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzVFLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9