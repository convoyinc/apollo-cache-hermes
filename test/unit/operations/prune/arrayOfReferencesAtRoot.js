"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operations_1 = require("../../../../src/operations");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.prune", function () {
    var extractResult;
    beforeAll(function () {
        var cacheContext = helpers_1.createStrictCacheContext();
        var snapshot = helpers_1.createGraphSnapshot({
            viewer: [
                {
                    id: 123,
                    name: 'Gouda',
                },
                {
                    id: 456,
                    name: 'Brie',
                },
                null,
            ],
        }, "{ viewer { id name } }", cacheContext);
        var pruneQuery = helpers_1.query("{ viewer { id }}");
        var pruned = operations_1.prune(cacheContext, snapshot, pruneQuery);
        extractResult = operations_1.extract(pruned.snapshot, cacheContext);
    });
    // `entities referenced by an array of references at the root`
    it("prunes fields from entities referenced by an array at the root correctly", function () {
        expect(extractResult).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                type: 0 /* EntitySnapshot */,
                outbound: [
                    { id: '123', path: ['viewer', 0] },
                    { id: '456', path: ['viewer', 1] },
                ],
                data: {
                    viewer: [undefined, undefined, null],
                },
            },
            _a['123'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: QueryRootId, path: ['viewer', 0] }],
                data: { id: 123 },
            },
            _a['456'] = {
                type: 0 /* EntitySnapshot */,
                inbound: [{ id: QueryRootId, path: ['viewer', 1] }],
                data: { id: 456 },
            },
            _a));
        var _a;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlPZlJlZmVyZW5jZXNBdFJvb3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcnJheU9mUmVmZXJlbmNlc0F0Um9vdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlEQUE0RDtBQUM1RCxpREFBb0U7QUFDcEUsNENBQXdGO0FBRWhGLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtJQUMzQixJQUFJLGFBQXlDLENBQUM7SUFDOUMsU0FBUyxDQUFDO1FBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztRQUNoRCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7WUFDRSxNQUFNLEVBQUU7Z0JBQ047b0JBQ0UsRUFBRSxFQUFFLEdBQUc7b0JBQ1AsSUFBSSxFQUFFLE9BQU87aUJBQ2Q7Z0JBQ0Q7b0JBQ0UsRUFBRSxFQUFFLEdBQUc7b0JBQ1AsSUFBSSxFQUFFLE1BQU07aUJBQ2I7Z0JBQ0QsSUFBSTthQUNMO1NBQ0YsRUFDRCx3QkFBd0IsRUFDeEIsWUFBWSxDQUNiLENBQUM7UUFFRixJQUFNLFVBQVUsR0FBRyxlQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUM3QyxJQUFNLE1BQU0sR0FBRyxrQkFBSyxDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDekQsYUFBYSxHQUFHLG9CQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUN6RCxDQUFDLENBQUMsQ0FBQztJQUVILDhEQUE4RDtJQUU5RCxFQUFFLENBQUMsMEVBQTBFLEVBQUU7UUFDN0UsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM5QixHQUFDLFdBQVcsSUFBRztnQkFDYixJQUFJLHdCQUE4QztnQkFDbEQsUUFBUSxFQUFFO29CQUNSLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7b0JBQ2xDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7aUJBQ25DO2dCQUNELElBQUksRUFBRTtvQkFDSixNQUFNLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQztpQkFDckM7YUFDRjtZQUNELFNBQUssR0FBRTtnQkFDTCxJQUFJLHdCQUE4QztnQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFO2FBQ2xCO1lBQ0QsU0FBSyxHQUFFO2dCQUNMLElBQUksd0JBQThDO2dCQUNsRCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ25ELElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUU7YUFDbEI7Z0JBQ0QsQ0FBQzs7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=