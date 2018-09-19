"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var context_1 = require("../../../src/context");
var ParsedQueryNode_1 = require("../../../src/ParsedQueryNode");
var util_1 = require("../../../src/util");
var helpers_1 = require("../../helpers");
describe("parseQuery for queries with fragments", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    function parseOperation(operationString) {
        var document = graphql_tag_1.default(operationString);
        var operation = util_1.getOperationOrDie(document);
        var FragmentMap = util_1.fragmentMapForDocument(document);
        return ParsedQueryNode_1.parseQuery(context, FragmentMap, operation.selectionSet);
    }
    it("parses queries with static fragments", function () {
        var operation = "\n      query getThings {\n        foo { ...aFoo }\n      }\n\n      fragment aFoo on Foo {\n        id\n        name\n      }\n    ";
        expect(parseOperation(operation)).to.deep.eq({
            parsedQuery: {
                foo: new ParsedQueryNode_1.ParsedQueryNode({
                    id: new ParsedQueryNode_1.ParsedQueryNode(),
                    name: new ParsedQueryNode_1.ParsedQueryNode(),
                }),
            },
            variables: new Set(),
        });
    });
    it("parses queries with overlapping fragments", function () {
        var operation = "\n      query getThings {\n        foo {\n          ...smallFoo\n          ...bigFoo\n        }\n      }\n\n      fragment smallFoo on Foo {\n        id\n      }\n\n      fragment bigFoo on Foo {\n        id\n        name\n      }\n    ";
        expect(parseOperation(operation)).to.deep.eq({
            parsedQuery: {
                foo: new ParsedQueryNode_1.ParsedQueryNode({
                    id: new ParsedQueryNode_1.ParsedQueryNode(),
                    name: new ParsedQueryNode_1.ParsedQueryNode(),
                }),
            },
            variables: new Set(),
        });
    });
    it("parses fragments with parameterized fields", function () {
        var operation = "\n      query getThings {\n        foo { ...aFoo }\n      }\n\n      fragment aFoo on Foo {\n        bar(extra: true) {\n          baz\n        }\n      }\n    ";
        expect(parseOperation(operation)).to.deep.eq({
            parsedQuery: {
                foo: new ParsedQueryNode_1.ParsedQueryNode({
                    bar: new ParsedQueryNode_1.ParsedQueryNode({
                        baz: new ParsedQueryNode_1.ParsedQueryNode(),
                    }, undefined, { extra: true }),
                }, undefined, undefined, true),
            },
            variables: new Set(),
        });
    });
    it("parses fragments with variables", function () {
        var operation = "\n      query getThings($count: Int) {\n        foo { ...aFoo }\n      }\n\n      fragment aFoo on Foo {\n        bar(limit: $count) {\n          baz\n        }\n      }\n    ";
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
    it("complains if fragments are not declared", function () {
        var operation = "\n      query getThings {\n        foo { ...aFoo }\n      }\n    ";
        expect(function () {
            parseOperation(operation);
        }).to.throw(/aFoo/i);
    });
    it("complains if parameters do not match", function () {
        var operation = "\n      query getThings {\n        foo {\n          ...fooOne\n          ...fooTwo\n        }\n      }\n\n      fragment fooOne on Foo {\n        bar(limit: 1)\n      }\n\n      fragment fooTwo on Foo {\n        bar(limit: 2)\n      }\n    ";
        expect(function () {
            parseOperation(operation);
        }).to.throw(/foo\.bar/i);
    });
    it("complains if aliases do not match", function () {
        var operation = "\n      query getThings {\n        foo {\n          ...fooOne\n          ...fooTwo\n        }\n      }\n\n      fragment fooOne on Foo {\n        bar: fizz\n      }\n\n      fragment fooTwo on Foo {\n        bar: buzz\n      }\n    ";
        expect(function () {
            parseOperation(operation);
        }).to.throw(/foo\.bar/i);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhZ21lbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZnJhZ21lbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQThCO0FBRTlCLGdEQUFvRDtBQUNwRCxnRUFBNkY7QUFFN0YsMENBQThFO0FBQzlFLHlDQUE2QztBQUU3QyxRQUFRLENBQUMsdUNBQXVDLEVBQUU7SUFFaEQsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyx3QkFBd0IsZUFBdUI7UUFDN0MsSUFBTSxRQUFRLEdBQUcscUJBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN0QyxJQUFNLFNBQVMsR0FBRyx3QkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxJQUFNLFdBQVcsR0FBRyw2QkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRCxNQUFNLENBQUMsNEJBQVUsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQsRUFBRSxDQUFDLHNDQUFzQyxFQUFFO1FBQ3pDLElBQU0sU0FBUyxHQUFHLHNJQVNqQixDQUFDO1FBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzNDLFdBQVcsRUFBRTtnQkFDWCxHQUFHLEVBQUUsSUFBSSxpQ0FBZSxDQUFDO29CQUN2QixFQUFFLEVBQUUsSUFBSSxpQ0FBZSxFQUFFO29CQUN6QixJQUFJLEVBQUUsSUFBSSxpQ0FBZSxFQUFFO2lCQUM1QixDQUFDO2FBQ0g7WUFDRCxTQUFTLEVBQUUsSUFBSSxHQUFHLEVBQUU7U0FDckIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsMkNBQTJDLEVBQUU7UUFDOUMsSUFBTSxTQUFTLEdBQUcsOE9BZ0JqQixDQUFDO1FBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzNDLFdBQVcsRUFBRTtnQkFDWCxHQUFHLEVBQUUsSUFBSSxpQ0FBZSxDQUFDO29CQUN2QixFQUFFLEVBQUUsSUFBSSxpQ0FBZSxFQUFFO29CQUN6QixJQUFJLEVBQUUsSUFBSSxpQ0FBZSxFQUFFO2lCQUM1QixDQUFDO2FBQ0g7WUFDRCxTQUFTLEVBQUUsSUFBSSxHQUFHLEVBQUU7U0FDckIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsNENBQTRDLEVBQUU7UUFDL0MsSUFBTSxTQUFTLEdBQUcsa0tBVWpCLENBQUM7UUFDRixNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDM0MsV0FBVyxFQUFFO2dCQUNYLEdBQUcsRUFBRSxJQUFJLGlDQUFlLENBQUM7b0JBQ3ZCLEdBQUcsRUFBRSxJQUFJLGlDQUFlLENBQUM7d0JBQ3ZCLEdBQUcsRUFBRSxJQUFJLGlDQUFlLEVBQUU7cUJBQzNCLEVBQUUsU0FBUyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDO2lCQUMvQixFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDO2FBQy9CO1lBQ0QsU0FBUyxFQUFFLElBQUksR0FBRyxFQUFFO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGlDQUFpQyxFQUFFO1FBQ3BDLElBQU0sU0FBUyxHQUFHLGlMQVVqQixDQUFDO1FBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzNDLFdBQVcsRUFBRTtnQkFDWCxHQUFHLEVBQUUsSUFBSSxpQ0FBZSxDQUFDO29CQUN2QixHQUFHLEVBQUUsSUFBSSxpQ0FBZSxDQUFnQzt3QkFDdEQsR0FBRyxFQUFFLElBQUksaUNBQWUsRUFBRTtxQkFDM0IsRUFBRSxTQUFTLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxrQ0FBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2lCQUN4RCxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDO2FBQy9CO1lBQ0QsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDOUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMseUNBQXlDLEVBQUU7UUFDNUMsSUFBTSxTQUFTLEdBQUcsbUVBSWpCLENBQUM7UUFDRixNQUFNLENBQUM7WUFDTCxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2QixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxzQ0FBc0MsRUFBRTtRQUN6QyxJQUFNLFNBQVMsR0FBRyxrUEFlakIsQ0FBQztRQUNGLE1BQU0sQ0FBQztZQUNMLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzNCLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLG1DQUFtQyxFQUFFO1FBQ3RDLElBQU0sU0FBUyxHQUFHLDBPQWVqQixDQUFDO1FBQ0YsTUFBTSxDQUFDO1lBQ0wsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDM0IsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9