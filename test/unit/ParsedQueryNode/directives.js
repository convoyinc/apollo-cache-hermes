"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var context_1 = require("../../../src/context");
var ParsedQueryNode_1 = require("../../../src/ParsedQueryNode");
var util_1 = require("../../../src/util");
var helpers_1 = require("../../helpers");
describe("parseQuery with queries with directives", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    function parseOperation(operationString) {
        var document = graphql_tag_1.default(operationString);
        var operation = util_1.getOperationOrDie(document);
        var FragmentMap = util_1.fragmentMapForDocument(document);
        return ParsedQueryNode_1.parseQuery(context, FragmentMap, operation.selectionSet);
    }
    it("collects variables in directives on fields", function () {
        var operation = "{\n      foo {\n        bar @simple(arg: $varA)\n        baz(bat: \"bad\") @complex(arg0: $varB, arg1: $varC)\n      }\n    }";
        expect(parseOperation(operation).variables).to.deep.eq(new Set(['varA', 'varB', 'varC']));
    });
    it("collects variables in directives in and on fragments", function () {
        var operation = "\n      query getThings {\n        foo {\n          ...smallFoo @simple(arg0: $varD)\n          ...bigFoo\n        }\n      }\n\n      fragment smallFoo on Foo {\n        id\n      }\n\n      fragment bigFoo on Foo {\n        id @simple(var0: $varA)\n        name @complex(arg0: $varB, arg1: $varC)\n      }\n    ";
        expect(parseOperation(operation).variables).to.deep.eq(new Set(['varA', 'varB', 'varC', 'varD']));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpcmVjdGl2ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBOEI7QUFFOUIsZ0RBQW9EO0FBQ3BELGdFQUEwRDtBQUMxRCwwQ0FBOEU7QUFDOUUseUNBQTZDO0FBRTdDLFFBQVEsQ0FBQyx5Q0FBeUMsRUFBRTtJQUVsRCxJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQy9DLHdCQUF3QixlQUF1QjtRQUM3QyxJQUFNLFFBQVEsR0FBRyxxQkFBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3RDLElBQU0sU0FBUyxHQUFHLHdCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLElBQU0sV0FBVyxHQUFHLDZCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sQ0FBQyw0QkFBVSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCxFQUFFLENBQUMsNENBQTRDLEVBQUU7UUFDL0MsSUFBTSxTQUFTLEdBQUcsK0hBS2hCLENBQUM7UUFDSCxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUNwRCxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FDbEMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLHNEQUFzRCxFQUFFO1FBQ3pELElBQU0sU0FBUyxHQUFHLDJUQWdCakIsQ0FBQztRQUNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3BELElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FDMUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==