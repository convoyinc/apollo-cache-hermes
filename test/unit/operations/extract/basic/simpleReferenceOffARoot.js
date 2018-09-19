"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("simple references hanging off a root", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                viewer: {
                    id: 123,
                    name: 'Gouda',
                },
                justValue: '42',
            }, "{\n          viewer {\n            id\n            name\n          }\n          justValue\n        }", cacheContext);
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serializable object", function () {
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [{ id: '123', path: ['viewer'] }],
                    data: {
                        justValue: '42',
                        viewer: undefined,
                    },
                },
                _a['123'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['viewer'] }],
                    data: { id: 123, name: 'Gouda' },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlUmVmZXJlbmNlT2ZmQVJvb3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzaW1wbGVSZWZlcmVuY2VPZmZBUm9vdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlFQUFnRTtBQUNoRSxvREFBdUU7QUFDdkUsK0NBQW9GO0FBRTVFLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtJQUM3QixRQUFRLENBQUMsc0NBQXNDLEVBQUU7UUFFL0MsSUFBSSxhQUF5QyxDQUFDO1FBQzlDLFNBQVMsQ0FBQztZQUNSLElBQU0sWUFBWSxHQUFHLGtDQUF3QixFQUFFLENBQUM7WUFDaEQsSUFBTSxRQUFRLEdBQUcsNkJBQW1CLENBQ2xDO2dCQUNFLE1BQU0sRUFBRTtvQkFDTixFQUFFLEVBQUUsR0FBRztvQkFDUCxJQUFJLEVBQUUsT0FBTztpQkFDZDtnQkFDRCxTQUFTLEVBQUUsSUFBSTthQUNoQixFQUNELHNHQU1FLEVBQ0YsWUFBWSxDQUNiLENBQUM7WUFFRixhQUFhLEdBQUcsaUJBQU8sQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsbUNBQW1DLEVBQUU7WUFDdEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDOUIsR0FBQyxXQUFXLElBQUc7b0JBQ2IsSUFBSSx3QkFBOEM7b0JBQ2xELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUMzQyxJQUFJLEVBQUU7d0JBQ0osU0FBUyxFQUFFLElBQUk7d0JBQ2YsTUFBTSxFQUFFLFNBQVM7cUJBQ2xCO2lCQUNGO2dCQUNELFNBQUssR0FBRTtvQkFDTCxJQUFJLHdCQUE4QztvQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ2hELElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTtpQkFDakM7b0JBQ0QsQ0FBQzs7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==