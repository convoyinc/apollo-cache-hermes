"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var context_1 = require("../../../src/context");
var ParsedQueryNode_1 = require("../../../src/ParsedQueryNode");
var util_1 = require("../../../src/util");
var helpers_1 = require("../../helpers");
describe("parseQuery with parameterized queries", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    function parseOperation(operationString) {
        var operation = util_1.getOperationOrDie(graphql_tag_1.default(operationString));
        return ParsedQueryNode_1.parseQuery(context, {}, operation.selectionSet);
    }
    it("parses single-field queries", function () {
        expect(parseOperation("{ foo(arg: 1) }")).to.deep.eq({
            parsedQuery: {
                foo: new ParsedQueryNode_1.ParsedQueryNode(undefined, undefined, { arg: 1 }),
            },
            variables: new Set(),
        });
    });
    it("parses queries with variables", function () {
        var operation = "\n      query getThings($count: Int) {\n        foo(limit: $count)\n      }\n    ";
        expect(parseOperation(operation)).to.deep.eq({
            parsedQuery: {
                foo: new ParsedQueryNode_1.ParsedQueryNode(undefined, undefined, { limit: new ParsedQueryNode_1.VariableArgument('count') }),
            },
            variables: new Set(['count']),
        });
    });
    it("flags ancestors of parameterized fields", function () {
        var operation = "\n      query getThings($count: Int) {\n        foo {\n          bar {\n            baz(limit: $count)\n          }\n        }\n      }\n    ";
        expect(parseOperation(operation)).to.deep.eq({
            parsedQuery: {
                foo: new ParsedQueryNode_1.ParsedQueryNode({
                    bar: new ParsedQueryNode_1.ParsedQueryNode({
                        baz: new ParsedQueryNode_1.ParsedQueryNode(undefined, undefined, { limit: new ParsedQueryNode_1.VariableArgument('count') }),
                    }, undefined, undefined, true),
                }, undefined, undefined, true),
            },
            variables: new Set(['count']),
        });
    });
    it("preserves descendants of parameterized fields", function () {
        var operation = "\n      query getThings($count: Int) {\n        foo {\n          bar(limit: $count) {\n            baz\n          }\n        }\n      }\n    ";
        expect(parseOperation(operation)).to.deep.eq({
            parsedQuery: {
                foo: new ParsedQueryNode_1.ParsedQueryNode({
                    bar: new ParsedQueryNode_1.ParsedQueryNode({
                        baz: new ParsedQueryNode_1.ParsedQueryNode(),
                    }, undefined, { limit: new ParsedQueryNode_1.VariableArgument('count') }),
                }, undefined, undefined, true),
            },
            variables: new Set(['count']),
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVyaXplZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBhcmFtZXRlcml6ZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBOEI7QUFFOUIsZ0RBQW9EO0FBQ3BELGdFQUE2RjtBQUU3RiwwQ0FBc0Q7QUFDdEQseUNBQTZDO0FBRTdDLFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRTtJQUVoRCxJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLHdCQUF3QixlQUF1QjtRQUM3QyxJQUFNLFNBQVMsR0FBRyx3QkFBaUIsQ0FBQyxxQkFBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDMUQsTUFBTSxDQUFDLDRCQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELEVBQUUsQ0FBQyw2QkFBNkIsRUFBRTtRQUNoQyxNQUFNLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNuRCxXQUFXLEVBQUU7Z0JBQ1gsR0FBRyxFQUFFLElBQUksaUNBQWUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO2FBQzNEO1lBQ0QsU0FBUyxFQUFFLElBQUksR0FBRyxFQUFFO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLCtCQUErQixFQUFFO1FBQ2xDLElBQU0sU0FBUyxHQUFHLG1GQUlqQixDQUFDO1FBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzNDLFdBQVcsRUFBRTtnQkFDWCxHQUFHLEVBQUUsSUFBSSxpQ0FBZSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxrQ0FBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2FBQ3pGO1lBQ0QsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDOUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMseUNBQXlDLEVBQUU7UUFDNUMsSUFBTSxTQUFTLEdBQUcsK0lBUWpCLENBQUM7UUFDRixNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDM0MsV0FBVyxFQUFFO2dCQUNYLEdBQUcsRUFBRSxJQUFJLGlDQUFlLENBQUM7b0JBQ3ZCLEdBQUcsRUFBRSxJQUFJLGlDQUFlLENBQUM7d0JBQ3ZCLEdBQUcsRUFBRSxJQUFJLGlDQUFlLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLGtDQUFnQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7cUJBQ3pGLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUM7aUJBQy9CLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUM7YUFDL0I7WUFDRCxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUM5QixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQywrQ0FBK0MsRUFBRTtRQUNsRCxJQUFNLFNBQVMsR0FBRywrSUFRakIsQ0FBQztRQUNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMzQyxXQUFXLEVBQUU7Z0JBQ1gsR0FBRyxFQUFFLElBQUksaUNBQWUsQ0FBQztvQkFDdkIsR0FBRyxFQUFFLElBQUksaUNBQWUsQ0FBZ0M7d0JBQ3RELEdBQUcsRUFBRSxJQUFJLGlDQUFlLEVBQUU7cUJBQzNCLEVBQUUsU0FBUyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksa0NBQWdCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztpQkFDeEQsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQzthQUMvQjtZQUNELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzlCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==