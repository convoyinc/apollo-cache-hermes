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
    var listQuery = helpers_1.query("{\n    foo {\n      id\n      bar { id }\n    }\n    baz {\n      id\n      bar { id }\n    }\n  }");
    describe("edit duplicate-references graph", function () {
        var snapshot;
        beforeAll(function () {
            var baseSnapshot = write_1.write(context, empty, listQuery, {
                foo: [
                    { id: 'a', bar: { id: 1 } },
                    { id: 'a', bar: { id: 1 } },
                    { id: 'b', bar: { id: 1 } },
                    { id: 'a', bar: { id: 1 } },
                    { id: 'b', bar: { id: 1 } },
                ],
                baz: {
                    id: 'a', bar: { id: 1 },
                },
            }).snapshot;
            var result = write_1.write(context, baseSnapshot, listQuery, {
                foo: [
                    { id: 'a', bar: { id: 2 } },
                    { id: 'a', bar: { id: 2 } },
                    { id: 'b', bar: null },
                    { id: 'a', bar: { id: 2 } },
                    { id: 'b', bar: null },
                ],
                baz: {
                    id: 'a', bar: { id: 2 },
                },
            });
            snapshot = result.snapshot;
        });
        it("writes the complete graph", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                foo: [
                    { id: 'a', bar: { id: 2 } },
                    { id: 'a', bar: { id: 2 } },
                    { id: 'b', bar: null },
                    { id: 'a', bar: { id: 2 } },
                    { id: 'b', bar: null },
                ],
                baz: {
                    id: 'a', bar: { id: 2 },
                },
            });
        });
        it("doesn't insert duplicate outbound references", function () {
            expect(snapshot.getNodeSnapshot('a').outbound).to.have.deep.members([
                { id: '2', path: ['bar'] },
            ]);
            expect(snapshot.getNodeSnapshot('b').outbound).to.eq(undefined);
        });
        it("removes unreferenced nodes", function () {
            expect(snapshot.getNodeSnapshot('1')).to.eq(undefined);
        });
        it("doesn't insert duplicate inbound references for targets", function () {
            expect(snapshot.getNodeSnapshot('2').inbound).to.have.deep.members([
                { id: 'a', path: ['bar'] },
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdER1cGxpY2F0ZVJlZmVyZW5jZXNHcmFwaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVkaXREdXBsaWNhdGVSZWZlcmVuY2VzR3JhcGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzREFBMEQ7QUFDMUQsa0VBQWlFO0FBQ2pFLDZEQUE0RDtBQUM1RCxvREFBeUQ7QUFDekQsK0NBQTBEO0FBRWxELElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUUzQixJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBQ2xDLElBQU0sU0FBUyxHQUFHLGVBQUssQ0FBQyxvR0FTdEIsQ0FBQyxDQUFDO0lBRUosUUFBUSxDQUFDLGlDQUFpQyxFQUFFO1FBRTFDLElBQUksUUFBdUIsQ0FBQztRQUM1QixTQUFTLENBQUM7WUFDQSxJQUFBOzs7Ozs7Ozs7Ozt1QkFBc0IsQ0FXM0I7WUFFSCxJQUFNLE1BQU0sR0FBRyxhQUFLLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUU7Z0JBQ3JELEdBQUcsRUFBRTtvQkFDSCxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUMzQixFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUMzQixFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtvQkFDdEIsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDM0IsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUU7aUJBQ3ZCO2dCQUNELEdBQUcsRUFBRTtvQkFDSCxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7aUJBQ3hCO2FBQ0YsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsMkJBQTJCLEVBQUU7WUFDOUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzNCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzNCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFO29CQUN0QixFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUMzQixFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtpQkFDdkI7Z0JBQ0QsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtpQkFDeEI7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw4Q0FBOEMsRUFBRTtZQUNqRCxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ25FLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRTthQUMzQixDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDRCQUE0QixFQUFFO1lBQy9CLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx5REFBeUQsRUFBRTtZQUM1RCxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ2xFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRTthQUMzQixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==