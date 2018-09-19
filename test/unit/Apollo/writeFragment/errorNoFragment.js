"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var context_1 = require("../../../helpers/context");
describe("writeFragment with no fragment", function () {
    var hermes;
    beforeAll(function () {
        hermes = new Hermes_1.Hermes(new CacheContext_1.CacheContext(context_1.strictConfig));
    });
    it("throws an error", function () {
        expect(function () {
            hermes.writeFragment({
                id: '123',
                fragment: graphql_tag_1.default("\n          query viewer {\n            id\n            name\n          }\n        "),
                data: {
                    id: 123,
                    name: 'Gouda',
                    __typename: 'Viewer',
                },
            });
        }).to.throw(/No operations are allowed when using a fragment as a query/i);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JOb0ZyYWdtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXJyb3JOb0ZyYWdtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQThCO0FBRTlCLHdEQUF1RDtBQUN2RCxxRUFBb0U7QUFDcEUsb0RBQXdEO0FBRXhELFFBQVEsQ0FBQyxnQ0FBZ0MsRUFBRTtJQUV6QyxJQUFJLE1BQWMsQ0FBQztJQUNuQixTQUFTLENBQUM7UUFDUixNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSwyQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGlCQUFpQixFQUFFO1FBQ3BCLE1BQU0sQ0FBQztZQUNMLE1BQU0sQ0FBQyxhQUFhLENBQUM7Z0JBQ25CLEVBQUUsRUFBRSxLQUFLO2dCQUNULFFBQVEsRUFBRSxxQkFBRyxDQUFDLHFGQUtiLENBQUM7Z0JBQ0YsSUFBSSxFQUFFO29CQUNKLEVBQUUsRUFBRSxHQUFHO29CQUNQLElBQUksRUFBRSxPQUFPO29CQUNiLFVBQVUsRUFBRSxRQUFRO2lCQUNyQjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsNkRBQTZELENBQUMsQ0FBQztJQUM3RSxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=