"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operations_1 = require("../../../../src/operations");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.prune", function () {
    var cacheContext;
    var snapshot;
    beforeAll(function () {
        cacheContext = helpers_1.createStrictCacheContext();
        snapshot = helpers_1.createGraphSnapshot({
            rows: {
                elements: [
                    [
                        { id: 'a', value: 1 },
                        { id: 'b', value: 2 },
                    ],
                    [
                        { id: 'c', value: 3 },
                        { id: 'd', value: 4 },
                        null,
                    ],
                    null,
                ],
            },
        }, "query getTable($tableName: String!) {\n        rows {\n          elements(table: $tableName) {\n            id\n            value\n          }\n        }\n      }", cacheContext, { tableName: 'This is table name' });
    });
    it("returns empty result if value for the parameterized variable is unknown", function () {
        var pruneQuery = helpers_1.query("query getTable($tableName: String!) {\n        rows {\n          elements(table: $tableName) {\n            id\n            value\n          }\n        }\n      }", { tableName: 'Something else' });
        var pruned = operations_1.prune(cacheContext, snapshot, pruneQuery);
        expect(pruned.complete).to.be.false;
        var extractResult = operations_1.extract(pruned.snapshot, cacheContext);
        expect(extractResult).to.deep.eq((_a = {},
            _a[QueryRootId] = {
                data: { rows: null },
                type: 0 /* EntitySnapshot */,
            },
            _a));
        var _a;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVyaXplZFVua25vd25WYXJpYWJsZVZhbHVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGFyYW1ldGVyaXplZFVua25vd25WYXJpYWJsZVZhbHVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEseURBQTREO0FBQzVELGlEQUFvRTtBQUNwRSw0Q0FBd0Y7QUFDaEYsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBQzNCLElBQUksWUFBMEIsQ0FBQztJQUMvQixJQUFJLFFBQXVCLENBQUM7SUFDNUIsU0FBUyxDQUFDO1FBQ1IsWUFBWSxHQUFHLGtDQUF3QixFQUFFLENBQUM7UUFDMUMsUUFBUSxHQUFHLDZCQUFtQixDQUM1QjtZQUNFLElBQUksRUFBRTtnQkFDSixRQUFRLEVBQUU7b0JBQ1I7d0JBQ0UsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQ3JCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3FCQUN0QjtvQkFDRDt3QkFDRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt3QkFDckIsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQ3JCLElBQUk7cUJBQ0w7b0JBQ0QsSUFBSTtpQkFDTDthQUNGO1NBQ0YsRUFDRCxvS0FPRSxFQUNGLFlBQVksRUFDWixFQUFFLFNBQVMsRUFBRSxvQkFBb0IsRUFBRSxDQUNwQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMseUVBQXlFLEVBQUU7UUFDNUUsSUFBTSxVQUFVLEdBQUcsZUFBSyxDQUN0QixvS0FPRSxFQUFFLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixFQUFFLENBQ3BDLENBQUM7UUFDRixJQUFNLE1BQU0sR0FBRyxrQkFBSyxDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDekQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQztRQUVwQyxJQUFNLGFBQWEsR0FBRyxvQkFBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDN0QsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM5QixHQUFDLFdBQVcsSUFBRztnQkFDYixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO2dCQUNwQixJQUFJLHdCQUE4QzthQUNuRDtnQkFDRCxDQUFDOztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==