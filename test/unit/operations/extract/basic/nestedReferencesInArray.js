"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("nested references in an array", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                one: {
                    two: [
                        { three: { id: 0 } },
                        { three: { id: 1 } },
                    ],
                },
            }, "{ \n            one {\n              two {\n                three { id }\n              }\n            }\n        }", cacheContext);
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [
                        { id: '0', path: ['one', 'two', 0, 'three'] },
                        { id: '1', path: ['one', 'two', 1, 'three'] },
                    ],
                    data: {
                        one: {
                            two: [{ three: undefined }, { three: undefined }],
                        },
                    },
                },
                _a['0'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
                    data: { id: 0 },
                },
                _a['1'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
                    data: { id: 1 },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkUmVmZXJlbmNlc0luQXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXN0ZWRSZWZlcmVuY2VzSW5BcnJheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlFQUFnRTtBQUNoRSxvREFBdUU7QUFDdkUsK0NBQW9GO0FBRTVFLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtJQUM3QixRQUFRLENBQUMsK0JBQStCLEVBQUU7UUFFeEMsSUFBSSxhQUF5QyxDQUFDO1FBQzlDLFNBQVMsQ0FBQztZQUNSLElBQU0sWUFBWSxHQUFHLGtDQUF3QixFQUFFLENBQUM7WUFDaEQsSUFBTSxRQUFRLEdBQUcsNkJBQW1CLENBQ2xDO2dCQUNFLEdBQUcsRUFBRTtvQkFDSCxHQUFHLEVBQUU7d0JBQ0gsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7d0JBQ3BCLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO3FCQUNyQjtpQkFDRjthQUNGLEVBQ0QscUhBTUUsRUFDRixZQUFZLENBQ2IsQ0FBQztZQUVGLGFBQWEsR0FBRyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtZQUN2QyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM5QixHQUFDLFdBQVcsSUFBRztvQkFDYixJQUFJLHdCQUE4QztvQkFDbEQsUUFBUSxFQUFFO3dCQUNSLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBRTt3QkFDN0MsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxFQUFFO3FCQUM5QztvQkFDRCxJQUFJLEVBQUU7d0JBQ0osR0FBRyxFQUFFOzRCQUNILEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDO3lCQUNsRDtxQkFDRjtpQkFDRjtnQkFDRCxPQUFHLEdBQUU7b0JBQ0gsSUFBSSx3QkFBOEM7b0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNoRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2lCQUNoQjtnQkFDRCxPQUFHLEdBQUU7b0JBQ0gsSUFBSSx3QkFBOEM7b0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNoRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2lCQUNoQjtvQkFDRCxDQUFDOztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9