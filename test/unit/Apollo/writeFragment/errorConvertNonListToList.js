"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var context_1 = require("../../../helpers/context");
describe("writeFragment", function () {
    var hermes;
    beforeAll(function () {
        hermes = new Hermes_1.Hermes(new CacheContext_1.CacheContext(context_1.strictConfig));
        hermes.writeQuery({
            query: graphql_tag_1.default("\n        query getViewer {\n          viewer {\n            id\n            name\n            __typename\n            trucks(number: 2) {\n              name\n              year\n            }\n          }\n        }\n      "),
            data: {
                viewer: {
                    id: 123,
                    name: 'Gouda',
                    __typename: 'Viewer',
                    trucks: {
                        name: 'truck0',
                        year: '1998',
                    },
                },
            },
        });
    });
    it("throws an error when trying to convert from list to non-list", function () {
        expect(function () {
            hermes.writeFragment({
                id: '123',
                fragment: graphql_tag_1.default("\n          fragment viewer on Viewer {\n            id\n            trucks(number: 2) {\n              name\n              year\n              driverName\n            }\n          }\n        "),
                data: {
                    id: 123,
                    trucks: [
                        {
                            name: 'truck0',
                            year: '1998',
                            driverName: 'Bob',
                        },
                    ],
                },
            });
        }).to.throw(/Unsupported transition from a non-list to list value/i);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JDb252ZXJ0Tm9uTGlzdFRvTGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVycm9yQ29udmVydE5vbkxpc3RUb0xpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBOEI7QUFFOUIsd0RBQXVEO0FBQ3ZELHFFQUFvRTtBQUNwRSxvREFBd0Q7QUFFeEQsUUFBUSxDQUFDLGVBQWUsRUFBRTtJQUV4QixJQUFJLE1BQWMsQ0FBQztJQUNuQixTQUFTLENBQUM7UUFDUixNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSwyQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBQyxVQUFVLENBQUM7WUFDaEIsS0FBSyxFQUFFLHFCQUFHLENBQUMsbU9BWVYsQ0FBQztZQUNGLElBQUksRUFBRTtnQkFDSixNQUFNLEVBQUU7b0JBQ04sRUFBRSxFQUFFLEdBQUc7b0JBQ1AsSUFBSSxFQUFFLE9BQU87b0JBQ2IsVUFBVSxFQUFFLFFBQVE7b0JBQ3BCLE1BQU0sRUFBRTt3QkFDTixJQUFJLEVBQUUsUUFBUTt3QkFDZCxJQUFJLEVBQUUsTUFBTTtxQkFDYjtpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsOERBQThELEVBQUU7UUFDakUsTUFBTSxDQUFDO1lBQ0wsTUFBTSxDQUFDLGFBQWEsQ0FBQztnQkFDbkIsRUFBRSxFQUFFLEtBQUs7Z0JBQ1QsUUFBUSxFQUFFLHFCQUFHLENBQUMsa01BU2IsQ0FBQztnQkFDRixJQUFJLEVBQUU7b0JBQ0osRUFBRSxFQUFFLEdBQUc7b0JBQ1AsTUFBTSxFQUFFO3dCQUNOOzRCQUNFLElBQUksRUFBRSxRQUFROzRCQUNkLElBQUksRUFBRSxNQUFNOzRCQUNaLFVBQVUsRUFBRSxLQUFLO3lCQUNsQjtxQkFDRjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsdURBQXVELENBQUMsQ0FBQztJQUN2RSxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=