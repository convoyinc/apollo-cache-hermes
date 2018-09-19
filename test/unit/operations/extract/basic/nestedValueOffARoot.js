"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extract_1 = require("../../../../../src/operations/extract");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.extract", function () {
    describe("nested values hanging off of a root", function () {
        var extractResult;
        beforeAll(function () {
            var cacheContext = helpers_1.createStrictCacheContext();
            var snapshot = helpers_1.createGraphSnapshot({
                bar: {
                    value: 42,
                    prop1: 'hello',
                    prop2: {
                        nestedProp1: 1000,
                        nestedProp2: 'world',
                    },
                    prop3: ['hello', 'world'],
                },
            }, "{\n          bar {\n            value\n            prop1\n            prop2\n            prop3\n          }\n        }", cacheContext);
            extractResult = extract_1.extract(snapshot, cacheContext);
        });
        it("extracts JSON serialization object", function () {
            expect(extractResult).to.deep.eq((_a = {},
                _a[QueryRootId] = {
                    type: 0 /* EntitySnapshot */,
                    data: {
                        bar: {
                            value: 42,
                            prop1: 'hello',
                            prop2: {
                                nestedProp1: 1000,
                                nestedProp2: 'world',
                            },
                            prop3: ['hello', 'world'],
                        },
                    },
                },
                _a));
            var _a;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkVmFsdWVPZmZBUm9vdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5lc3RlZFZhbHVlT2ZmQVJvb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpRUFBZ0U7QUFDaEUsb0RBQXVFO0FBQ3ZFLCtDQUFvRjtBQUU1RSxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLHFDQUFxQyxFQUFFO1FBRTlDLElBQUksYUFBeUMsQ0FBQztRQUM5QyxTQUFTLENBQUM7WUFDUixJQUFNLFlBQVksR0FBRyxrQ0FBd0IsRUFBRSxDQUFDO1lBQ2hELElBQU0sUUFBUSxHQUFHLDZCQUFtQixDQUNsQztnQkFDRSxHQUFHLEVBQUU7b0JBQ0gsS0FBSyxFQUFFLEVBQUU7b0JBQ1QsS0FBSyxFQUFFLE9BQU87b0JBQ2QsS0FBSyxFQUFFO3dCQUNMLFdBQVcsRUFBRSxJQUFJO3dCQUNqQixXQUFXLEVBQUUsT0FBTztxQkFDckI7b0JBQ0QsS0FBSyxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztpQkFDMUI7YUFDRixFQUNELHdIQU9FLEVBQ0YsWUFBWSxDQUNiLENBQUM7WUFFRixhQUFhLEdBQUcsaUJBQU8sQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsb0NBQW9DLEVBQUU7WUFDdkMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDOUIsR0FBQyxXQUFXLElBQUc7b0JBQ2IsSUFBSSx3QkFBOEM7b0JBQ2xELElBQUksRUFBRTt3QkFDSixHQUFHLEVBQUU7NEJBQ0gsS0FBSyxFQUFFLEVBQUU7NEJBQ1QsS0FBSyxFQUFFLE9BQU87NEJBQ2QsS0FBSyxFQUFFO2dDQUNMLFdBQVcsRUFBRSxJQUFJO2dDQUNqQixXQUFXLEVBQUUsT0FBTzs2QkFDckI7NEJBQ0QsS0FBSyxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQzt5QkFDMUI7cUJBQ0Y7aUJBQ0Y7b0JBQ0QsQ0FBQzs7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==