"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("top-level parameterized reference", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                foo: {
                    id: 1,
                    name: 'Foo',
                    extra: false,
                },
            }, "query getAFoo($id: ID!) {\n          foo(id: $id, withExtra: true) {\n            id name extra\n          }\n        }", cacheContext, { id: 1 });
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
            var parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['foo'], { id: 1, withExtra: true });
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [{ id: parameterizedId, path: ['foo'] }],
                },
                _a[parameterizedId] = {
                    type: 1 /* ParameterizedValueSnapshot */,
                    inbound: [{ id: QueryRootId, path: ['foo'] }],
                    outbound: [{ id: '1', path: [] }],
                    data: null,
                },
                _a['1'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: parameterizedId, path: [] }],
                    data: {
                        id: 1,
                        name: 'Foo',
                        extra: false,
                    },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9wTGV2ZWxQYXJhbWV0ZXJpemVkUmVmZXJlbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidG9wTGV2ZWxQYXJhbWV0ZXJpemVkUmVmZXJlbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUVBQWdFO0FBQ2hFLCtFQUEyRjtBQUMzRixvREFBdUU7QUFDdkUsK0NBQW9GO0FBRTVFLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtJQUM3QixRQUFRLENBQUMsbUNBQW1DLEVBQUU7UUFFNUMsSUFBSSxhQUF5QyxDQUFDO1FBQzlDLFNBQVMsQ0FBQztZQUNSLElBQU0sWUFBWSxHQUFHLGtDQUF3QixFQUFFLENBQUM7WUFDaEQsSUFBTSxRQUFRLEdBQUcsNkJBQW1CLENBQ2xDO2dCQUNFLEdBQUcsRUFBRTtvQkFDSCxFQUFFLEVBQUUsQ0FBQztvQkFDTCxJQUFJLEVBQUUsS0FBSztvQkFDWCxLQUFLLEVBQUUsS0FBSztpQkFDYjthQUNGLEVBQ0QseUhBSUUsRUFDRixZQUFZLEVBQ1osRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQ1YsQ0FBQztZQUVGLGFBQWEsR0FBRyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtZQUN2QyxJQUFNLGVBQWUsR0FBRyw0Q0FBMkIsQ0FBQyxXQUFXLEVBQzdELENBQUMsS0FBSyxDQUFDLEVBQ1AsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FDM0IsQ0FBQztZQUVGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQzlCLEdBQUMsV0FBVyxJQUFHO29CQUNiLElBQUksd0JBQThDO29CQUNsRCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztpQkFDbkQ7Z0JBQ0QsR0FBQyxlQUFlLElBQUc7b0JBQ2pCLElBQUksb0NBQTBEO29CQUM5RCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDN0MsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQztvQkFDakMsSUFBSSxFQUFFLElBQUk7aUJBQ1g7Z0JBQ0QsT0FBRyxHQUFFO29CQUNILElBQUksd0JBQThDO29CQUNsRCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO29CQUM1QyxJQUFJLEVBQUU7d0JBQ0osRUFBRSxFQUFFLENBQUM7d0JBQ0wsSUFBSSxFQUFFLEtBQUs7d0JBQ1gsS0FBSyxFQUFFLEtBQUs7cUJBQ2I7aUJBQ0Y7b0JBQ0QsQ0FBQzs7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==