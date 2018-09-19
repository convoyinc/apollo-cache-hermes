"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../src/apollo/Hermes");
var helpers_1 = require("../../helpers");
describe("transform document before writeQuery", function () {
    var hermes;
    beforeAll(function () {
        hermes = new Hermes_1.Hermes(tslib_1.__assign({}, helpers_1.strictConfig, { addTypename: true }));
        hermes.writeQuery({
            query: graphql_tag_1.default("\n        query getViewer {\n          viewer {\n            id\n            name\n          }\n        }\n      "),
            data: {
                viewer: {
                    id: 0,
                    name: 'Gouda',
                    __typename: 'Viewer',
                },
            },
        });
    });
    it("correctly writeQuery with __typename", function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkVHlwZU5hbWVCZWZvcmVXcml0ZVF1ZXJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWRkVHlwZU5hbWVCZWZvcmVXcml0ZVF1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUE4QjtBQUU5QixxREFBcUQ7QUFDckQseUNBQTZDO0FBRTdDLFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRTtJQUUvQyxJQUFJLE1BQWMsQ0FBQztJQUNuQixTQUFTLENBQUM7UUFDUixNQUFNLEdBQUcsSUFBSSxlQUFNLHNCQUNkLHNCQUFZLElBQ2YsV0FBVyxFQUFFLElBQUksSUFDakIsQ0FBQztRQUNILE1BQU0sQ0FBQyxVQUFVLENBQUM7WUFDaEIsS0FBSyxFQUFFLHFCQUFHLENBQUMsbUhBT1YsQ0FBQztZQUNGLElBQUksRUFBRTtnQkFDSixNQUFNLEVBQUU7b0JBQ04sRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLE9BQU87b0JBQ2IsVUFBVSxFQUFFLFFBQVE7aUJBQ3JCO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxzQ0FBc0MsRUFBRTtRQUN6QyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztZQUN0QixLQUFLLEVBQUUscUJBQUcsQ0FBQyxtSEFPVixDQUFDO1NBQ0gsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDYixNQUFNLEVBQUU7Z0JBQ04sRUFBRSxFQUFFLENBQUM7Z0JBQ0wsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsVUFBVSxFQUFFLFFBQVE7YUFDckI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=