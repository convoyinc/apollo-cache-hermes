"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operations_1 = require("../../../../../src/operations");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("operations.restore", function () {
    describe("invalid NodeSnapshot type", function () {
        it("throws error when restore invalid NodeSnapshot type", function () {
            expect(function () {
                var cacheContext = helpers_1.createStrictCacheContext();
                operations_1.restore((_a = {},
                    _a[QueryRootId] = {
                        type: 0 /* EntitySnapshot */,
                        outbound: [{ id: '1', path: ['foo'] }],
                        data: {},
                    },
                    _a['1'] = {
                        type: -1,
                        data: {
                            INVALID: 42,
                        },
                    },
                    _a), cacheContext);
                var _a;
            }).to.throw(/Invalid Serializable.NodeSnapshotType/i);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52YWxpZE5vZGVTbmFwc2hvdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludmFsaWROb2RlU25hcHNob3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0REFBd0Q7QUFDeEQsb0RBQXVFO0FBQ3ZFLCtDQUErRDtBQUV2RCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsb0JBQW9CLEVBQUU7SUFDN0IsUUFBUSxDQUFDLDJCQUEyQixFQUFFO1FBRXBDLEVBQUUsQ0FBQyxxREFBcUQsRUFBRTtZQUN4RCxNQUFNLENBQUM7Z0JBQ0wsSUFBTSxZQUFZLEdBQUcsa0NBQXdCLEVBQUUsQ0FBQztnQkFDaEQsb0JBQU87b0JBQ0wsR0FBQyxXQUFXLElBQUc7d0JBQ2IsSUFBSSx3QkFBOEM7d0JBQ2xELFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUN0QyxJQUFJLEVBQUUsRUFBRztxQkFDVjtvQkFDRCxPQUFHLEdBQUU7d0JBQ0gsSUFBSSxFQUFFLENBQUMsQ0FBQzt3QkFDUixJQUFJLEVBQUU7NEJBQ0osT0FBTyxFQUFFLEVBQUU7eUJBQ1o7cUJBQ0Y7eUJBQ0EsWUFBWSxDQUFDLENBQUM7O1lBQ25CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==