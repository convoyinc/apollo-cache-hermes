"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("new array of values hanging off of a root", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
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
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serializable object", function () {
            expect(extractResult).to.deep.eq((_a = {},
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
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlPZlZhbHVlc09mZkFSb290LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXJyYXlPZlZhbHVlc09mZkFSb290LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUVBQWdFO0FBQ2hFLG9EQUF1RTtBQUN2RSwrQ0FBb0Y7QUFFNUUsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQywyQ0FBMkMsRUFBRTtRQUVwRCxJQUFJLGFBQXlDLENBQUM7UUFDOUMsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztZQUNoRCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7Z0JBQ0UsTUFBTSxFQUFFO29CQUNOO3dCQUNFLE1BQU0sRUFBRSxHQUFHO3dCQUNYLElBQUksRUFBRSxPQUFPO3FCQUNkO29CQUNEO3dCQUNFLE1BQU0sRUFBRSxHQUFHO3dCQUNYLElBQUksRUFBRSxNQUFNO3FCQUNiO2lCQUNGO2FBQ0YsRUFDRCw0QkFBNEIsRUFDNUIsWUFBWSxDQUNiLENBQUM7WUFFRixhQUFhLEdBQUcsaUJBQU8sQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsbUNBQW1DLEVBQUU7WUFDdEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDOUIsR0FBQyxXQUFXLElBQUc7b0JBQ2IsSUFBSSx3QkFBOEM7b0JBQ2xELElBQUksRUFBRTt3QkFDSixNQUFNLEVBQUU7NEJBQ047Z0NBQ0UsTUFBTSxFQUFFLEdBQUc7Z0NBQ1gsSUFBSSxFQUFFLE9BQU87NkJBQ2Q7NEJBQ0Q7Z0NBQ0UsTUFBTSxFQUFFLEdBQUc7Z0NBQ1gsSUFBSSxFQUFFLE1BQU07NkJBQ2I7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7b0JBQ0QsQ0FBQzs7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==