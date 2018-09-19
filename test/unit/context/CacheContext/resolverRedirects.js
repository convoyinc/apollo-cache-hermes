"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var context_1 = require("../../../../src/context");
var GraphSnapshot_1 = require("../../../../src/GraphSnapshot");
var operations_1 = require("../../../../src/operations");
var helpers_1 = require("../../../helpers");
describe("operations.read", function () {
    describe("with resolver redirects", function () {
        var context = new context_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { resolverRedirects: {
                Query: {
                    thing: function (_a) {
                        var id = _a.id;
                        return id;
                    },
                },
                NestedType: {
                    thing: function (_a) {
                        var id = _a.id;
                        return id;
                    },
                },
            } }));
        var initialQuery = helpers_1.query("{\n      entities { __typename id name }\n      nested { __typename }\n    }");
        var rootRedirectQuery = helpers_1.query("\n      query getRoot($id: number) {\n        thing(id: $id) { __typename id name }\n      }\n    ");
        var nestedRedirectQuery = helpers_1.query("\n      query getNested($id: number) {\n        nested {\n          __typename\n          thing(id: $id) { __typename id name }\n        }\n      }\n    ");
        var baseSnapshot = operations_1.write(context, new GraphSnapshot_1.GraphSnapshot(), initialQuery, {
            entities: [
                { __typename: 'Thing', id: 1, name: 'One' },
                { __typename: 'Thing', id: 2, name: 'Two' },
            ],
            nested: { __typename: 'NestedType' },
        }).snapshot;
        it("follows resolver redirects on the query root", function () {
            var _a = operations_1.read(context, tslib_1.__assign({}, rootRedirectQuery, { variables: { id: 1 } }), baseSnapshot), result = _a.result, complete = _a.complete;
            expect(result.thing).to.deep.eq({ __typename: 'Thing', id: 1, name: 'One' });
            expect(complete).to.eq(true);
        });
        it("follows resolver redirects on the query root", function () {
            var _a = operations_1.read(context, tslib_1.__assign({}, nestedRedirectQuery, { variables: { id: 1 } }), baseSnapshot), result = _a.result, complete = _a.complete;
            expect(result.nested.thing).to.deep.eq({ __typename: 'Thing', id: 1, name: 'One' });
            expect(complete).to.eq(true);
        });
        it("prefers explicitly queried values, when present", function () {
            var snapshot = operations_1.write(context, baseSnapshot, tslib_1.__assign({}, rootRedirectQuery, { variables: { id: 1 } }), {
                thing: { __typename: 'Thing', id: 111, name: 'Other One' },
            }).snapshot;
            var _a = operations_1.read(context, tslib_1.__assign({}, rootRedirectQuery, { variables: { id: 1 } }), snapshot), result = _a.result, complete = _a.complete;
            expect(result.thing).to.deep.eq({ __typename: 'Thing', id: 111, name: 'Other One' });
            expect(complete).to.eq(true);
        });
        it("supports redirects to nowhere", function () {
            var _a = operations_1.read(context, tslib_1.__assign({}, rootRedirectQuery, { variables: { id: 123 } }), baseSnapshot), result = _a.result, complete = _a.complete;
            expect(result.thing).to.deep.eq(undefined);
            expect(complete).to.eq(false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZXJSZWRpcmVjdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXNvbHZlclJlZGlyZWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFBdUQ7QUFDdkQsK0RBQThEO0FBQzlELHlEQUF5RDtBQUN6RCw0Q0FBdUQ7QUFFdkQsUUFBUSxDQUFDLGlCQUFpQixFQUFFO0lBQzFCLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRTtRQUVsQyxJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFZLHNCQUMzQixzQkFBWSxJQUNmLGlCQUFpQixFQUFFO2dCQUNqQixLQUFLLEVBQUU7b0JBQ0wsS0FBSyxFQUFFLFVBQUMsRUFBTTs0QkFBSixVQUFFO3dCQUFPLE9BQUEsRUFBRTtvQkFBRixDQUFFO2lCQUN0QjtnQkFDRCxVQUFVLEVBQUU7b0JBQ1YsS0FBSyxFQUFFLFVBQUMsRUFBTTs0QkFBSixVQUFFO3dCQUFPLE9BQUEsRUFBRTtvQkFBRixDQUFFO2lCQUN0QjthQUNGLElBQ0QsQ0FBQztRQUVILElBQU0sWUFBWSxHQUFHLGVBQUssQ0FBQyw4RUFHekIsQ0FBQyxDQUFDO1FBQ0osSUFBTSxpQkFBaUIsR0FBRyxlQUFLLENBQUMsb0dBSS9CLENBQUMsQ0FBQztRQUNILElBQU0sbUJBQW1CLEdBQUcsZUFBSyxDQUFDLDJKQU9qQyxDQUFDLENBQUM7UUFFSCxJQUFNLFlBQVksR0FBRyxrQkFBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLDZCQUFhLEVBQUUsRUFBRSxZQUFZLEVBQUU7WUFDckUsUUFBUSxFQUFFO2dCQUNSLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7Z0JBQzNDLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7YUFDNUM7WUFDRCxNQUFNLEVBQUUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFO1NBQ3JDLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFFWixFQUFFLENBQUMsOENBQThDLEVBQUU7WUFDM0MsSUFBQSxnSEFBa0csRUFBaEcsa0JBQU0sRUFBRSxzQkFBUSxDQUFpRjtZQUN6RyxNQUFNLENBQUUsTUFBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDhDQUE4QyxFQUFFO1lBQzNDLElBQUEsa0hBQW9HLEVBQWxHLGtCQUFNLEVBQUUsc0JBQVEsQ0FBbUY7WUFDM0csTUFBTSxDQUFFLE1BQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDN0YsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsaURBQWlELEVBQUU7WUFDNUMsSUFBQTs7dUJBQVEsQ0FFYjtZQUVHLElBQUEsNEdBQThGLEVBQTVGLGtCQUFNLEVBQUUsc0JBQVEsQ0FBNkU7WUFDckcsTUFBTSxDQUFFLE1BQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUM5RixNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywrQkFBK0IsRUFBRTtZQUM1QixJQUFBLGtIQUFvRyxFQUFsRyxrQkFBTSxFQUFFLHNCQUFRLENBQW1GO1lBQzNHLE1BQU0sQ0FBRSxNQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=