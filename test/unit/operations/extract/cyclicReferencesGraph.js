"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../src/operations/extract");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("cyclic GraphSnapshot", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
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
            }, "{\n          foo {\n            id\n            name\n            bar {\n              id\n              name\n              fizz { id }\n              buzz { id }\n            }\n          }\n        }", cacheContext);
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [{ id: '1', path: ['foo'] }],
                    data: {
                        foo: undefined,
                    },
                },
                _a['1'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [
                        { id: QueryRootId, path: ['foo'] },
                        { id: '2', path: ['fizz'] },
                    ],
                    outbound: [
                        { id: '2', path: ['bar'] },
                    ],
                    data: {
                        id: 1,
                        name: 'Foo',
                        bar: undefined,
                    },
                },
                _a['2'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [
                        { id: '1', path: ['bar'] },
                        { id: '2', path: ['buzz'] },
                    ],
                    outbound: [
                        { id: '1', path: ['fizz'] },
                        { id: '2', path: ['buzz'] },
                    ],
                    data: {
                        id: 2,
                        name: 'Bar',
                        fizz: undefined,
                        buzz: undefined,
                    },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3ljbGljUmVmZXJlbmNlc0dyYXBoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3ljbGljUmVmZXJlbmNlc0dyYXBoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsOERBQTZEO0FBQzdELGlEQUFvRTtBQUNwRSw0Q0FBaUY7QUFFekUsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0lBQzdCLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRTtRQUUvQixJQUFJLGFBQXlDLENBQUM7UUFDOUMsU0FBUyxDQUFDO1lBQ1IsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztZQUNoRCxJQUFNLFFBQVEsR0FBRyw2QkFBbUIsQ0FDbEM7Z0JBQ0UsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxDQUFDO29CQUNMLElBQUksRUFBRSxLQUFLO29CQUNYLEdBQUcsRUFBRTt3QkFDSCxFQUFFLEVBQUUsQ0FBQzt3QkFDTCxJQUFJLEVBQUUsS0FBSzt3QkFDWCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO3dCQUNmLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7cUJBQ2hCO2lCQUNGO2FBQ0YsRUFDRCw0TUFXRSxFQUNGLFlBQVksQ0FDYixDQUFDO1lBRUYsYUFBYSxHQUFHLGlCQUFPLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFO1lBQ3ZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQzlCLEdBQUMsV0FBVyxJQUFHO29CQUNiLElBQUksd0JBQThDO29CQUNsRCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDdEMsSUFBSSxFQUFFO3dCQUNKLEdBQUcsRUFBRSxTQUFTO3FCQUNmO2lCQUNGO2dCQUNELE9BQUcsR0FBRTtvQkFDSCxJQUFJLHdCQUE4QztvQkFDbEQsT0FBTyxFQUFFO3dCQUNQLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRTt3QkFDbEMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFO3FCQUM1QjtvQkFDRCxRQUFRLEVBQUU7d0JBQ1IsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFO3FCQUMzQjtvQkFDRCxJQUFJLEVBQUU7d0JBQ0osRUFBRSxFQUFFLENBQUM7d0JBQ0wsSUFBSSxFQUFFLEtBQUs7d0JBQ1gsR0FBRyxFQUFFLFNBQVM7cUJBQ2Y7aUJBQ0Y7Z0JBQ0QsT0FBRyxHQUFFO29CQUNILElBQUksd0JBQThDO29CQUNsRCxPQUFPLEVBQUU7d0JBQ1AsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFO3dCQUMxQixFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUU7cUJBQzVCO29CQUNELFFBQVEsRUFBRTt3QkFDUixFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUU7d0JBQzNCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRTtxQkFDNUI7b0JBQ0QsSUFBSSxFQUFFO3dCQUNKLEVBQUUsRUFBRSxDQUFDO3dCQUNMLElBQUksRUFBRSxLQUFLO3dCQUNYLElBQUksRUFBRSxTQUFTO3dCQUNmLElBQUksRUFBRSxTQUFTO3FCQUNoQjtpQkFDRjtvQkFDRCxDQUFDOztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9