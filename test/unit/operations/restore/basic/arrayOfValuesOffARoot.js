"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("../../../../../src/nodes");
var operations_1 = require("../../../../../src/operations");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.restore", function () {
    describe("new array of values hanging off of a root", function () {
        var restoreGraphSnapshot, originalGraphSnapshot;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            originalGraphSnapshot = helpers_1.createGraphSnapshot({
                viewer: [
                    {
                        postal: 123,
                        name: 'Gouda',
                    },
                    {
                        postal: 456,
                        name: 'Brie',
                    },
                ],
            }, "{ viewer { postal name } }", cacheContext);
            restoreGraphSnapshot = operations_1.restore((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    data: {
                        viewer: [
                            {
                                postal: 123,
                                name: 'Gouda',
                            },
                            {
                                postal: 456,
                                name: 'Brie',
                            },
                        ],
                    },
                },
                _a), cacheContext).cacheSnapshot.baseline;
            var _a;
        });
        it("restores GraphSnapshot from JSON serializable object", function () {
            expect(restoreGraphSnapshot).to.deep.eq(originalGraphSnapshot);
        });
        it("correctly restores different types of NodeSnapshot", function () {
            expect(restoreGraphSnapshot.getNodeSnapshot(QueryRootId)).to.be.an.instanceOf(nodes_1.EntitySnapshot);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlPZlZhbHVlc09mZkFSb290LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXJyYXlPZlZhbHVlc09mZkFSb290LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esa0RBQTBEO0FBQzFELDREQUF3RDtBQUN4RCxvREFBdUU7QUFDdkUsK0NBQW9GO0FBRTVFLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtJQUM3QixRQUFRLENBQUMsMkNBQTJDLEVBQUU7UUFFcEQsSUFBSSxvQkFBbUMsRUFBRSxxQkFBb0MsQ0FBQztRQUM5RSxTQUFTLENBQUM7WUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1lBQ2hELHFCQUFxQixHQUFHLDZCQUFtQixDQUN6QztnQkFDRSxNQUFNLEVBQUU7b0JBQ047d0JBQ0UsTUFBTSxFQUFFLEdBQUc7d0JBQ1gsSUFBSSxFQUFFLE9BQU87cUJBQ2Q7b0JBQ0Q7d0JBQ0UsTUFBTSxFQUFFLEdBQUc7d0JBQ1gsSUFBSSxFQUFFLE1BQU07cUJBQ2I7aUJBQ0Y7YUFDRixFQUNELDRCQUE0QixFQUM1QixZQUFZLENBQ2IsQ0FBQztZQUVGLG9CQUFvQixHQUFHLG9CQUFPO2dCQUM1QixHQUFDLFdBQVcsSUFBRztvQkFDYixJQUFJLHdCQUE4QztvQkFDbEQsSUFBSSxFQUFFO3dCQUNKLE1BQU0sRUFBRTs0QkFDTjtnQ0FDRSxNQUFNLEVBQUUsR0FBRztnQ0FDWCxJQUFJLEVBQUUsT0FBTzs2QkFDZDs0QkFDRDtnQ0FDRSxNQUFNLEVBQUUsR0FBRztnQ0FDWCxJQUFJLEVBQUUsTUFBTTs2QkFDYjt5QkFDRjtxQkFDRjtpQkFDRjtxQkFDQSxZQUFZLENBQUMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDOztRQUMxQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxzREFBc0QsRUFBRTtZQUN6RCxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9EQUFvRCxFQUFFO1lBQ3ZELE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQWMsQ0FBQyxDQUFDO1FBQ2hHLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9