"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var graphql_tag_1 = require("graphql-tag");
var util_1 = require("../../../src/apollo/util");
var context_1 = require("../../../src/context");
var QueryInfo_1 = require("../../../src/context/QueryInfo");
var helpers_1 = require("../../helpers");
describe("context.QueryInfo", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    describe("with a valid query document", function () {
        var query, info;
        beforeAll(function () {
            query = graphql_tag_1.default(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["\n        fragment completeStuff on Stuff {\n          id\n          name\n        }\n\n        query getThings($ids: [ID]!) {\n          stuff { ...completeStuff }\n          things(ids: $ids) {\n            ...completeThing\n          }\n        }\n\n        fragment completeThing on Thing {\n          id\n          name\n          extra\n        }\n      "], ["\n        fragment completeStuff on Stuff {\n          id\n          name\n        }\n\n        query getThings($ids: [ID]!) {\n          stuff { ...completeStuff }\n          things(ids: $ids) {\n            ...completeThing\n          }\n        }\n\n        fragment completeThing on Thing {\n          id\n          name\n          extra\n        }\n      "])));
            info = new QueryInfo_1.QueryInfo(context, util_1.buildRawOperationFromQuery(query));
        });
        it("hangs onto the document, with no changes", function () {
            expect(info.document).to.eq(query);
        });
        it("extracts the operation", function () {
            expect(info.operation.name.value).to.eq('getThings');
            expect(info.operation.operation).to.eq('query');
        });
        it("extracts the operation name", function () {
            expect(info.operationName).to.eq('getThings');
        });
        it("builds a fragment map", function () {
            expect(info.fragmentMap).to.have.all.keys('completeStuff', 'completeThing');
        });
        it("collects the variables that are used", function () {
            expect(info.variables).to.deep.eq(new Set(['ids']));
        });
    });
    describe("with variable defaults", function () {
        var query, info;
        beforeAll(function () {
            query = graphql_tag_1.default(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["\n        mutation makeCheesy($ids: [ID]!, $name: String = \"Munster\", $stinky: Boolean) {\n          updateCheesiness(ids: $ids, name: $name, stinky: $stinky)\n        }\n      "], ["\n        mutation makeCheesy($ids: [ID]!, $name: String = \"Munster\", $stinky: Boolean) {\n          updateCheesiness(ids: $ids, name: $name, stinky: $stinky)\n        }\n      "])));
            info = new QueryInfo_1.QueryInfo(context, util_1.buildRawOperationFromQuery(query));
        });
        it("collects the variables that are used", function () {
            expect(info.variables).to.deep.eq(new Set(['ids', 'name', 'stinky']));
        });
        it("collects default values for operation parameters", function () {
            expect(info.variableDefaults['name']).to.eq('Munster');
        });
        it("includes optional arguments as having a default value of null", function () {
            expect(info.variableDefaults['stinky']).to.eq(null);
        });
        it("excludes required parameters from the defaults", function () {
            expect(info.variableDefaults).to.not.have.key('ids');
        });
    });
    describe("validation", function () {
        it("asserts that all variables are declared", function () {
            expect(function () {
                new QueryInfo_1.QueryInfo(context, util_1.buildRawOperationFromQuery(graphql_tag_1.default(templateObject_3 || (templateObject_3 = tslib_1.__makeTemplateObject(["\n          query whoops($foo: Number) {\n            thing(foo: $foo, bar: $bar, baz: $baz)\n          }\n        "], ["\n          query whoops($foo: Number) {\n            thing(foo: $foo, bar: $bar, baz: $baz)\n          }\n        "])))));
            }).to.throw(/\$bar(.|\n)*\$baz/);
        });
        it("asserts that all variables are declared, when used via fragments", function () {
            expect(function () {
                new QueryInfo_1.QueryInfo(context, util_1.buildRawOperationFromQuery(graphql_tag_1.default(templateObject_4 || (templateObject_4 = tslib_1.__makeTemplateObject(["\n          query whoops($foo: Number) {\n            thing { ...stuff }\n          }\n\n          fragment stuff on Thing {\n            stuff(foo: $foo, bar: $bar, baz: $baz)\n          }\n        "], ["\n          query whoops($foo: Number) {\n            thing { ...stuff }\n          }\n\n          fragment stuff on Thing {\n            stuff(foo: $foo, bar: $bar, baz: $baz)\n          }\n        "])))));
            }).to.throw(/\$bar(.|\n)*\$baz/);
        });
        it("asserts that all variables are used", function () {
            expect(function () {
                new QueryInfo_1.QueryInfo(context, util_1.buildRawOperationFromQuery(graphql_tag_1.default(templateObject_5 || (templateObject_5 = tslib_1.__makeTemplateObject(["\n          query whoops($foo: Number, $bar: String, $baz: ID) {\n            thing(bar: $bar)\n          }\n        "], ["\n          query whoops($foo: Number, $bar: String, $baz: ID) {\n            thing(bar: $bar)\n          }\n        "])))));
            }).to.throw(/\$foo(.|\n)*\$baz/);
        });
        it("asserts that all variables are used, including fragments", function () {
            expect(function () {
                new QueryInfo_1.QueryInfo(context, util_1.buildRawOperationFromQuery(graphql_tag_1.default(templateObject_6 || (templateObject_6 = tslib_1.__makeTemplateObject(["\n          query whoops($foo: Number, $bar: String, $baz: ID) {\n            thing { ...stuff }\n          }\n\n          fragment stuff on Thing {\n            thing(bar: $bar)\n          }\n        "], ["\n          query whoops($foo: Number, $bar: String, $baz: ID) {\n            thing { ...stuff }\n          }\n\n          fragment stuff on Thing {\n            thing(bar: $bar)\n          }\n        "])))));
            }).to.throw(/\$foo(.|\n)*\$baz/);
        });
    });
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVlcnlJbmZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUXVlcnlJbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUE4QjtBQUU5QixpREFBc0U7QUFDdEUsZ0RBQW9EO0FBQ3BELDREQUEyRDtBQUMzRCx5Q0FBNkM7QUFFN0MsUUFBUSxDQUFDLG1CQUFtQixFQUFFO0lBRTVCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFFL0MsUUFBUSxDQUFDLDZCQUE2QixFQUFFO1FBRXRDLElBQUksS0FBbUIsRUFBRSxJQUFlLENBQUM7UUFDekMsU0FBUyxDQUFDO1lBQ1IsS0FBSyxHQUFHLHFCQUFHLHFiQUFBLDBXQWtCVixJQUFBLENBQUM7WUFFRixJQUFJLEdBQUcsSUFBSSxxQkFBUyxDQUFDLE9BQU8sRUFBRSxpQ0FBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDBDQUEwQyxFQUFFO1lBQzdDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx3QkFBd0IsRUFBRTtZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDZCQUE2QixFQUFFO1lBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUs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