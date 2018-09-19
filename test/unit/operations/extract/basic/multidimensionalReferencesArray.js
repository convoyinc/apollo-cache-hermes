"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("2d array of references hanging off of a root", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                rows: [
                    [
                        { id: 'a', value: 1 },
                        { id: 'b', value: 2 },
                    ],
                    [
                        { id: 'c', value: 3 },
                        { id: 'd', value: 4 },
                        null,
                    ],
                ],
            }, "{ \n          rows {\n            id\n            value\n          }\n        }", cacheContext);
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serializable object", function () {
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    outbound: [
                        { id: 'a', path: ['rows', 0, 0] },
                        { id: 'b', path: ['rows', 0, 1] },
                        { id: 'c', path: ['rows', 1, 0] },
                        { id: 'd', path: ['rows', 1, 1] },
                    ],
                    data: {
                        rows: [
                            [
                                undefined,
                                undefined,
                            ],
                            [
                                undefined,
                                undefined,
                                null,
                            ],
                        ],
                    },
                },
                _a['a'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['rows', 0, 0] }],
                    data: { id: 'a', value: 1 },
                },
                _a['b'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['rows', 0, 1] }],
                    data: { id: 'b', value: 2 },
                },
                _a['c'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['rows', 1, 0] }],
                    data: { id: 'c', value: 3 },
                },
                _a['d'] = {
                    type: 0 /* EntitySnapshot */,
                    inbound: [{ id: QueryRootId, path: ['rows', 1, 1] }],
                    data: { id: 'd', value: 4 },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlkaW1lbnNpb25hbFJlZmVyZW5jZXNBcnJheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm11bHRpZGltZW5zaW9uYWxSZWZlcmVuY2VzQXJyYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpRUFBZ0U7QUFDaEUsb0RBQXVFO0FBQ3ZFLCtDQUFvRjtBQUU1RSxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLDhDQUE4QyxFQUFFO1FBRXZELElBQUksYUFBeUMsQ0FBQztRQUM5QyxTQUFTLENBQUM7WUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1lBQ2hELElBQU0sUUFBUSxHQUFHLDZCQUFtQixDQUNsQztnQkFDRSxJQUFJLEVBQUU7b0JBQ0o7d0JBQ0UsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQ3JCLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3FCQUN0QjtvQkFDRDt3QkFDRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt3QkFDckIsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQ3JCLElBQUk7cUJBQ0w7aUJBQ0Y7YUFDRixFQUNELGlGQUtFLEVBQ0YsWUFBWSxDQUNiLENBQUM7WUFFRixhQUFhLEdBQUcsaUJBQU8sQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsbUNBQW1DLEVBQUU7WUFDdEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDOUIsR0FBQyxXQUFXLElBQUc7b0JBQ2IsSUFBSSx3QkFBOEM7b0JBQ2xELFFBQVEsRUFBRTt3QkFDUixFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTt3QkFDakMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7d0JBQ2pDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO3dCQUNqQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtxQkFDbEM7b0JBQ0QsSUFBSSxFQUFFO3dCQUNKLElBQUksRUFBRTs0QkFDSjtnQ0FDRSxTQUFTO2dDQUNULFNBQVM7NkJBQ1Y7NEJBQ0Q7Z0NBQ0UsU0FBUztnQ0FDVCxTQUFTO2dDQUNULElBQUk7NkJBQ0w7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7Z0JBQ0QsT0FBRyxHQUFFO29CQUNILElBQUksd0JBQThDO29CQUNsRCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNwRCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7aUJBQzVCO2dCQUNELE9BQUcsR0FBRTtvQkFDSCxJQUFJLHdCQUE4QztvQkFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDcEQsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO2lCQUM1QjtnQkFDRCxPQUFHLEdBQUU7b0JBQ0gsSUFBSSx3QkFBOEM7b0JBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3BELElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtpQkFDNUI7Z0JBQ0QsT0FBRyxHQUFFO29CQUNILElBQUksd0JBQThDO29CQUNsRCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNwRCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7aUJBQzVCO29CQUVELENBQUM7O1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=