"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("nested parameterized references with parameterized value", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                one: {
                    two: {
                        three: {
                            id: 31,
                            four: { five: 1 },
                        },
                    },
                },
            }, "query nested($id: ID!) {\n          one {\n            two(id: $id) {\n              three {\n                id\n                four(extra: true) {\n                  five\n                }\n              }\n            }\n          }\n        }", cacheContext, { id: 1 });
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
            var parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 });
            var nestedParameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue('31', ['four'], { extra: true });
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [{ id: parameterizedId, path: ['one', 'two'] }],
                },
                _a[parameterizedId] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two'] }],
                    outbound: [{ id: '31', path: ['three'] }],
                    data: {
                        three: undefined,
                    },
                },
                _a['31'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: parameterizedId, path: ['three'] }],
                    outbound: [{ id: nestedParameterizedId, path: ['four'] }],
                    data: {
                        id: 31,
                    },
                },
                _a[nestedParameterizedId] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: '31', path: ['four'] }],
                    data: {
                        five: 1,
                    },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZXNXaXRoUGFyYW1ldGVyaXplZFZhbHVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkUGFyYW1ldGVyaXplZFJlZmVyZW5jZXNXaXRoUGFyYW1ldGVyaXplZFZhbHVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUVBQWdFO0FBQ2hFLCtFQUEyRjtBQUMzRixvREFBdUU7QUFDdkUsK0NBQW9GO0FBRTVFLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtJQUM3QixRQUFRLENBQUMsMERBQTBELEVBQUU7UUFFbkUsSUFBSSxhQUF5QyxDQUFDO1FBQzlDLFNBQVMsQ0FBQztZQUNSLElBQU0sWUFBWSxHQUFHLGtDQUF3QixFQUFFLENBQUM7WUFDaEQsSUFBTSxRQUFRLEdBQUcsNkJBQW1CLENBQ2xDO2dCQUNFLEdBQUcsRUFBRTtvQkFDSCxHQUFHLEVBQUU7d0JBQ0gsS0FBSyxFQUFFOzRCQUNMLEVBQUUsRUFBRSxFQUFFOzRCQUNOLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7eUJBQ2xCO3FCQUNGO2lCQUNGO2FBQ0YsRUFDRCwwUEFXRSxFQUNGLFlBQVksRUFDWixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FDVixDQUFDO1lBRUYsYUFBYSxHQUFHLGlCQUFPLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFO1lBQ3ZDLElBQU0sZUFBZSxHQUFHLDRDQUEyQixDQUNqRCxXQUFXLEVBQ1gsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQ2QsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQ1YsQ0FBQztZQUVGLElBQU0scUJBQXFCLEdBQUcsNENBQTJCLENBQ3ZELElBQUksRUFDSixDQUFDLE1BQU0sQ0FBQyxFQUNSLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUNoQixDQUFDO1lBRUYsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDOUIsR0FBQyxXQUFXLElBQUc7b0JBQ2IsSUFBSSx3QkFBOEM7b0JBQ2xELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztpQkFDMUQ7Z0JBQ0QsR0FBQyxlQUFlLElBQUc7b0JBQ2pCLElBQUksb0NBQTBEO29CQUM5RCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3BELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUN6QyxJQUFJLEVBQUU7d0JBQ0osS0FBSyxFQUFFLFNBQVM7cUJBQ2pCO2lCQUNGO2dCQUNELFFBQUksR0FBRTtvQkFDSixJQUFJLHdCQUE4QztvQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ25ELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLHFCQUFxQixFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ3pELElBQUksRUFBRTt3QkFDSixFQUFFLEVBQUUsRUFBRTtxQkFDUDtpQkFDRjtnQkFDRCxHQUFDLHFCQUFxQixJQUFHO29CQUN2QixJQUFJLG9DQUEwRDtvQkFDOUQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ3ZDLElBQUksRUFBRTt3QkFDSixJQUFJLEVBQUUsQ0FBQztxQkFDUjtpQkFDRjtvQkFDRCxDQUFDOztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9