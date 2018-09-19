"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var context_1 = require("../../../src/context");
var ParsedQueryNode_1 = require("../../../src/ParsedQueryNode");
var util_1 = require("../../../src/util");
var helpers_1 = require("../../helpers");
describe("parseQuery with static queries", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    function parseOperation(operationString) {
        var operation = util_1.getOperationOrDie(graphql_tag_1.default(operationString));
        return ParsedQueryNode_1.parseQuery(context, {}, operation.selectionSet);
    }
    it("parses single-field queries", function () {
        expect(parseOperation("{ foo }")).to.deep.eq({
            parsedQuery: {
                foo: new ParsedQueryNode_1.ParsedQueryNode(),
            },
            variables: new Set(),
        });
    });
    it("parses queries with nested fields", function () {
        var operation = "{\n      foo {\n        bar { fizz }\n        baz { buzz }\n      }\n    }";
        expect(parseOperation(operation)).to.deep.eq({
            parsedQuery: {
                foo: new ParsedQueryNode_1.ParsedQueryNode({
                    bar: new ParsedQueryNode_1.ParsedQueryNode({
                        fizz: new ParsedQueryNode_1.ParsedQueryNode(),
                    }),
                    baz: new ParsedQueryNode_1.ParsedQueryNode({
                        buzz: new ParsedQueryNode_1.ParsedQueryNode(),
                    }),
                }),
            },
            variables: new Set(),
        });
    });
    it("includes a schemaName when a field is aliased", function () {
        expect(parseOperation("{ foo: bar }")).to.deep.eq({
            parsedQuery: {
                foo: new ParsedQueryNode_1.ParsedQueryNode(undefined, 'bar'),
            },
            variables: new Set(),
        });
    });
    it("supports multiple aliases of the same field", function () {
        var operation = "{\n      foo: fizz\n      bar: fizz\n      fizz\n    }";
        expect(parseOperation(operation)).to.deep.eq({
            parsedQuery: {
                foo: new ParsedQueryNode_1.ParsedQueryNode(undefined, 'fizz'),
                bar: new ParsedQueryNode_1.ParsedQueryNode(undefined, 'fizz'),
                fizz: new ParsedQueryNode_1.ParsedQueryNode(),
            },
            variables: new Set(),
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3RhdGljLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQThCO0FBRTlCLGdEQUFvRDtBQUNwRCxnRUFBMkU7QUFDM0UsMENBQXNEO0FBQ3RELHlDQUE2QztBQUU3QyxRQUFRLENBQUMsZ0NBQWdDLEVBQUU7SUFFekMsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyx3QkFBd0IsZUFBdUI7UUFDN0MsSUFBTSxTQUFTLEdBQUcsd0JBQWlCLENBQUMscUJBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzFELE1BQU0sQ0FBQyw0QkFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxFQUFFLENBQUMsNkJBQTZCLEVBQUU7UUFDaEMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzNDLFdBQVcsRUFBRTtnQkFDWCxHQUFHLEVBQUUsSUFBSSxpQ0FBZSxFQUFFO2FBQzNCO1lBQ0QsU0FBUyxFQUFFLElBQUksR0FBRyxFQUFFO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLG1DQUFtQyxFQUFFO1FBQ3RDLElBQU0sU0FBUyxHQUFHLDRFQUtoQixDQUFDO1FBQ0gsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzNDLFdBQVcsRUFBRTtnQkFDWCxHQUFHLEVBQUUsSUFBSSxpQ0FBZSxDQUFDO29CQUN2QixHQUFHLEVBQUUsSUFBSSxpQ0FBZSxDQUFDO3dCQUN2QixJQUFJLEVBQUUsSUFBSSxpQ0FBZSxFQUFFO3FCQUM1QixDQUFDO29CQUNGLEdBQUcsRUFBRSxJQUFJLGlDQUFlLENBQUM7d0JBQ3ZCLElBQUksRUFBRSxJQUFJLGlDQUFlLEVBQUU7cUJBQzVCLENBQUM7aUJBQ0gsQ0FBQzthQUNIO1lBQ0QsU0FBUyxFQUFFLElBQUksR0FBRyxFQUFFO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLCtDQUErQyxFQUFFO1FBQ2xELE1BQU0sQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNoRCxXQUFXLEVBQUU7Z0JBQ1gsR0FBRyxFQUFFLElBQUksaUNBQWUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDO2FBQzNDO1lBQ0QsU0FBUyxFQUFFLElBQUksR0FBRyxFQUFFO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDZDQUE2QyxFQUFFO1FBQ2hELElBQU0sU0FBUyxHQUFHLHdEQUloQixDQUFDO1FBQ0gsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzNDLFdBQVcsRUFBRTtnQkFDWCxHQUFHLEVBQUUsSUFBSSxpQ0FBZSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUM7Z0JBQzNDLEdBQUcsRUFBRSxJQUFJLGlDQUFlLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQztnQkFDM0MsSUFBSSxFQUFFLElBQUksaUNBQWUsRUFBRTthQUM1QjtZQUNELFNBQVMsRUFBRSxJQUFJLEdBQUcsRUFBRTtTQUNyQixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=