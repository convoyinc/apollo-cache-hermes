"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var util_1 = require("../../../src/apollo/util");
var context_1 = require("../../../src/context");
var ParsedQueryNode_1 = require("../../../src/ParsedQueryNode");
var helpers_1 = require("../../helpers");
describe("ParsedQueryNode.expandVariables", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    function makeFieldMap(query) {
        return new context_1.QueryInfo(context, util_1.buildRawOperationFromQuery(graphql_tag_1.default(query))).parsed;
    }
    it("handles static queries", function () {
        var map = makeFieldMap("\n      query stuff {\n        foo(limit: 5) {\n          bar(tag: \"hello\")\n        }\n        baz(thing: null)\n      }\n    ");
        expect(ParsedQueryNode_1.expandVariables(map, undefined)).to.deep.eq({
            foo: new ParsedQueryNode_1.ParsedQueryNode({
                bar: new ParsedQueryNode_1.ParsedQueryNode(undefined, undefined, { tag: 'hello' }),
            }, undefined, { limit: 5 }, true),
            baz: new ParsedQueryNode_1.ParsedQueryNode(undefined, undefined, { thing: null }),
        });
    });
    it("replaces top level variables", function () {
        var map = makeFieldMap("\n      query stuff($foo: ID!, $bar: String) {\n        thing(a: $foo, b: $bar)\n      }\n    ");
        expect(ParsedQueryNode_1.expandVariables(map, { foo: 123, bar: 'ohai' })).to.deep.eq({
            thing: new ParsedQueryNode_1.ParsedQueryNode(undefined, undefined, { a: 123, b: 'ohai' }),
        });
    });
    it("replaces top level variables of nested fields", function () {
        var map = makeFieldMap("\n      query stuff($foo: ID!, $bar: String) {\n        one {\n          two(a: $foo) {\n            three {\n              four(b: $bar)\n            }\n          }\n        }\n      }\n    ");
        expect(ParsedQueryNode_1.expandVariables(map, { foo: 123, bar: 'ohai' })).to.deep.eq({
            one: new ParsedQueryNode_1.ParsedQueryNode({
                two: new ParsedQueryNode_1.ParsedQueryNode({
                    three: new ParsedQueryNode_1.ParsedQueryNode({
                        four: new ParsedQueryNode_1.ParsedQueryNode(undefined, undefined, { b: 'ohai' }),
                    }, undefined, undefined, true),
                }, undefined, { a: 123 }, true),
            }, undefined, undefined, true),
        });
    });
    it("replaces nested variables", function () {
        var map = makeFieldMap("\n      query stuff($foo: ID!, $bar: String) {\n        thing(one: { two: $bar, three: [1, 2, $foo] })\n      }\n    ");
        expect(ParsedQueryNode_1.expandVariables(map, { foo: 123, bar: 'ohai' })).to.deep.eq({
            thing: new ParsedQueryNode_1.ParsedQueryNode(undefined, undefined, { one: { two: 'ohai', three: [1, 2, 123] } }),
        });
    });
    it("asserts that variables are provided when passed undefined", function () {
        var map = makeFieldMap("\n      query stuff($foo: ID!, $bar: String) {\n        thing(a: $foo, b: $bar)\n      }\n    ");
        expect(function () {
            ParsedQueryNode_1.expandVariables(map, undefined);
        }).to.throw(/\$(foo|bar)/);
    });
    it("asserts that variables are provided", function () {
        var map = makeFieldMap("\n      query stuff($foo: ID!, $bar: String) {\n        thing(a: $foo, b: $bar)\n      }\n    ");
        expect(function () {
            ParsedQueryNode_1.expandVariables(map, { foo: 123 });
        }).to.throw(/\$bar/);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwYW5kVmFyaWFibGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXhwYW5kVmFyaWFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQThCO0FBRTlCLGlEQUFzRTtBQUN0RSxnREFBK0Q7QUFDL0QsZ0VBQWdGO0FBRWhGLHlDQUE2QztBQUU3QyxRQUFRLENBQUMsaUNBQWlDLEVBQUU7SUFFMUMsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUUvQyxzQkFBc0IsS0FBYTtRQUNqQyxNQUFNLENBQUMsSUFBSSxtQkFBUyxDQUFDLE9BQU8sRUFBRSxpQ0FBMEIsQ0FBQyxxQkFBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDL0UsQ0FBQztJQUVELEVBQUUsQ0FBQyx3QkFBd0IsRUFBRTtRQUMzQixJQUFNLEdBQUcsR0FBRyxZQUFZLENBQUMsbUlBT3hCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxpQ0FBZSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2pELEdBQUcsRUFBRSxJQUFJLGlDQUFlLENBQWE7Z0JBQ25DLEdBQUcsRUFBRSxJQUFJLGlDQUFlLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQzthQUNqRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUM7WUFDakMsR0FBRyxFQUFFLElBQUksaUNBQWUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDO1NBQ2hFLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDhCQUE4QixFQUFFO1FBQ2pDLElBQU0sR0FBRyxHQUFHLFlBQVksQ0FB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