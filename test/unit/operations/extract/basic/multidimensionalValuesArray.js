"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("2d array of  values hanging off of a root", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                rows: [
                    [
                        { value: 1 },
                        { value: 2 },
                    ],
                    [
                        { value: 3 },
                        { value: 4 },
                    ],
                ],
            }, "{ \n          rows {\n            value\n          }\n        }", cacheContext);
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serializable object", function () {
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    data: {
                        rows: [
                            [
                                { value: 1 },
                                { value: 2 },
                            ],
                            [
                                { value: 3 },
                                { value: 4 },
                            ],
                        ],
                    },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlkaW1lbnNpb25hbFZhbHVlc0FycmF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXVsdGlkaW1lbnNpb25hbFZhbHVlc0FycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUVBQWdFO0FBQ2hFLG9EQUF1RTtBQUN2RSwrQ0FBb0Y7QUFFNUUsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQywyQ0FBMkMsRUFBRTtRQUVwRCxJQUFJLGFBQXlDLENBQUM7UUFDOUMsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztZQUNoRCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7Z0JBQ0UsSUFBSSxFQUFFO29CQUNKO3dCQUNFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt3QkFDWixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7cUJBQ2I7b0JBQ0Q7d0JBQ0UsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3dCQUNaLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtxQkFDYjtpQkFDRjthQUNGLEVBQ0QsaUVBSUUsRUFDRixZQUFZLENBQ2IsQ0FBQztZQUVGLGFBQWEsR0FBRyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRTtZQUN0QyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM5QixHQUFDLFdBQVcsSUFBRztvQkFDYixJQUFJLHdCQUE4QztvQkFDbEQsSUFBSSxFQUFFO3dCQUNKLElBQUksRUFBRTs0QkFDSjtnQ0FDRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7Z0NBQ1osRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFOzZCQUNiOzRCQUNEO2dDQUNFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtnQ0FDWixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7NkJBQ2I7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7b0JBQ0QsQ0FBQzs7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==