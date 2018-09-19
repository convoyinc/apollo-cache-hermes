"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../src/apollo/Hermes");
var SnapshotEditor_1 = require("../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../src/schema");
var helpers_1 = require("../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("transform document before writeFragmetn", function () {
    var hermes;
    beforeAll(function () {
        hermes = new Hermes_1.Hermes(tslib_1.__assign({}, helpers_1.strictConfig, { addTypename: true }));
        hermes.writeQuery({
            query: graphql_tag_1.default("\n        query getViewer {\n          viewer(count: 2) {\n            id\n            name\n          }\n        }\n      "),
            data: {
                viewer: [
                    {
                        id: 0,
                        name: 'G.',
                        __typename: 'Viewer',
                    },
                    {
                        id: 1,
                        name: 'M.',
                        __typename: 'Viewer',
                    },
                ],
            },
        });
        hermes.writeFragment({
            id: SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['viewer'], {
                count: 2,
            }),
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          name\n        }\n      "),
            data: [
                {
                    id: 0,
                    name: 'Gouda',
                    __typename: 'Viewer',
                },
                {
                    id: 1,
                    name: 'Munster',
                    __typename: 'Viewer',
                },
            ],
        });
    });
    it("correctly writeFragment with __typename", function () {
        expect(hermes.readQuery({
            query: graphql_tag_1.default("\n      query getViewer {\n        viewer(count: 2) {\n          id\n          name\n        }\n      }\n      "),
        })).to.deep.eq({
            viewer: [
                {
                    id: 0,
                    name: 'Gouda',
                    __typename: 'Viewer',
                },
                {
                    id: 1,
                    name: 'Munster',
                    __typename: 'Viewer',
                },
            ],
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkVHlwZU5hbWVCZWZvcmVXcml0ZUZyYWdtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWRkVHlwZU5hbWVCZWZvcmVXcml0ZUZyYWdtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUE4QjtBQUU5QixxREFBcUQ7QUFDckQseUVBQXFGO0FBQ3JGLDhDQUFtRDtBQUNuRCx5Q0FBNkM7QUFFckMsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLHlDQUF5QyxFQUFFO0lBRWxELElBQUksTUFBYyxDQUFDO0lBQ25CLFNBQVMsQ0FBQztRQUNSLE1BQU0sR0FBRyxJQUFJLGVBQU0sc0JBQ2Qsc0JBQVksSUFDZixXQUFXLEVBQUUsSUFBSSxJQUNqQixDQUFDO1FBQ0gsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUNoQixLQUFLLEVBQUUscUJBQUcsQ0FBQyw2SEFPVixDQUFDO1lBQ0YsSUFBSSxFQUFFO2dCQUNKLE1BQU0sRUFBRTtvQkFDTjt3QkFDRSxFQUFFLEVBQUUsQ0FBQzt3QkFDTCxJQUFJLEVBQUUsSUFBSTt3QkFDVixVQUFVLEVBQUUsUUFBUTtxQkFDckI7b0JBQ0Q7d0JBQ0UsRUFBRSxFQUFFLENBQUM7d0JBQ0wsSUFBSSxFQUFFLElBQUk7d0JBQ1YsVUFBVSxFQUFFLFFBQVE7cUJBQ3JCO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFDSCxNQUFNLENBQUMsYUFBYSxDQUFDO1lBQ25CLEVBQUUsRUFBRSw0Q0FBMkIsQ0FDN0IsV0FBVyxFQUNYLENBQUMsUUFBUSxDQUFDLEVBQ1Y7Z0JBQ0UsS0FBSyxFQUFFLENBQUM7YUFDVCxDQUNGO1lBQ0QsUUFBUSxFQUFFLHFCQUFHLENBQUMsd0ZBS2IsQ0FBQztZQUNGLElBQUksRUFBRTtnQkFDSjtvQkFDRSxFQUFFLEVBQUUsQ0FBQztvQkFDTCxJQUFJLEVBQUUsT0FBTztvQkFDYixVQUFVLEVBQUUsUUFBUTtpQkFDckI7Z0JBQ0Q7b0JBQ0UsRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsVUFBVSxFQUFFLFFBQVE7aUJBQ3JCO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRTtRQUM1QyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztZQUN0QixLQUFLLEVBQUUscUJBQUcsQ0FBQyxpSEFPVixDQUFDO1NBQ0gsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDYixNQUFNLEVBQUU7Z0JBQ047b0JBQ0UsRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLE9BQU87b0JBQ2IsVUFBVSxFQUFFLFFBQVE7aUJBQ3JCO2dCQUNEO29CQUNFLEVBQUUsRUFBRSxDQUFDO29CQUNMLElBQUksRUFBRSxTQUFTO29CQUNmLFVBQVUsRUFBRSxRQUFRO2lCQUNyQjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9