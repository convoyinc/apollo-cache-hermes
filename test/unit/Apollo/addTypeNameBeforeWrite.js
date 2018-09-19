"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../src/apollo/Hermes");
var schema_1 = require("../../../src/schema");
var helpers_1 = require("../../helpers");
describe("transform document before write", function () {
    var hermes;
    beforeAll(function () {
        hermes = new Hermes_1.Hermes(tslib_1.__assign({}, helpers_1.strictConfig, { addTypename: true }));
        hermes.write({
            query: graphql_tag_1.default("\n        query getViewer {\n          viewer {\n            id\n            name\n          }\n        }\n      "),
            result: {
                viewer: {
                    id: 0,
                    name: 'Gouda',
                    __typename: 'Viewer',
                },
            },
            dataId: schema_1.StaticNodeId.QueryRoot,
        });
    });
    it("correctly write with __typename", function () {
        expect(hermes.readQuery({
            query: graphql_tag_1.default("\n        query getViewer {\n          viewer {\n            id\n            name\n          }\n        }\n      "),
        })).to.deep.eq({
            viewer: {
                id: 0,
                name: 'Gouda',
                __typename: 'Viewer',
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkVHlwZU5hbWVCZWZvcmVXcml0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFkZFR5cGVOYW1lQmVmb3JlV3JpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQThCO0FBRTlCLHFEQUFxRDtBQUNyRCw4Q0FBbUQ7QUFDbkQseUNBQTZDO0FBRTdDLFFBQVEsQ0FBQyxpQ0FBaUMsRUFBRTtJQUUxQyxJQUFJLE1BQWMsQ0FBQztJQUNuQixTQUFTLENBQUM7UUFDUixNQUFNLEdBQUcsSUFBSSxlQUFNLHNCQUNkLHNCQUFZLElBQ2YsV0FBVyxFQUFFLElBQUksSUFDakIsQ0FBQztRQUNILE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDWCxLQUFLLEVBQUUscUJBQUcsQ0FBQyxtSEFPVixDQUFDO1lBQ0YsTUFBTSxFQUFFO2dCQUNOLE1BQU0sRUFBRTtvQkFDTixFQUFFLEVBQUUsQ0FBQztvQkFDTCxJQUFJLEVBQUUsT0FBTztvQkFDYixVQUFVLEVBQUUsUUFBUTtpQkFDckI7YUFDRjtZQUNELE1BQU0sRUFBRSxxQkFBWSxDQUFDLFNBQVM7U0FDL0IsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsaUNBQWlDLEVBQUU7UUFDcEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7WUFDdEIsS0FBSyxFQUFFLHFCQUFHLENBQUMsbUhBT1YsQ0FBQztTQUNILENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2IsTUFBTSxFQUFFO2dCQUNOLEVBQUUsRUFBRSxDQUFDO2dCQUNMLElBQUksRUFBRSxPQUFPO2dCQUNiLFVBQVUsRUFBRSxRQUFRO2FBQ3JCO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9