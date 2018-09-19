"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var graphql_tag_1 = require("graphql-tag");
var CacheContext_1 = require("../../../../src/context/CacheContext");
describe("context.CacheContext", function () {
    describe("parseQuery", function () {
        var simpleQuery = graphql_tag_1.default(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["{ foo }"], ["{ foo }"])));
        it("memoizes identical queries w/o variables", function () {
            var context = new CacheContext_1.CacheContext();
            var parsed1 = context.parseOperation({ rootId: 'root', document: simpleQuery });
            var parsed2 = context.parseOperation({ rootId: 'root', document: simpleQuery });
            expect(parsed1).to.eq(parsed2);
        });
        it("memoizes identical queries w/ the same variables", function () {
            var context = new CacheContext_1.CacheContext();
            var parsed1 = context.parseOperation({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });
            var parsed2 = context.parseOperation({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });
            expect(parsed1).to.eq(parsed2);
        });
        it("considers the rootId part of a query's identity", function () {
            var context = new CacheContext_1.CacheContext();
            var parsed1 = context.parseOperation({ rootId: 'root1', document: simpleQuery, variables: { a: 1 } });
            var parsed2 = context.parseOperation({ rootId: 'root2', document: simpleQuery, variables: { a: 1 } });
            expect(parsed1).to.not.eq(parsed2);
        });
        it("considers variables part of a query's identity", function () {
            var context = new CacheContext_1.CacheContext();
            var parsed1 = context.parseOperation({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });
            var parsed2 = context.parseOperation({ rootId: 'root', document: simpleQuery, variables: { a: 2 } });
            expect(parsed1).to.not.eq(parsed2);
        });
        it("doesn't get tripped up by undefined variables", function () {
            var context = new CacheContext_1.CacheContext();
            var parsed1 = context.parseOperation({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });
            var parsed2 = context.parseOperation({ rootId: 'root', document: simpleQuery });
            expect(parsed1).to.not.eq(parsed2);
        });
    });
});
var templateObject_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VRdWVyeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBhcnNlUXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQThCO0FBRTlCLHFFQUFvRTtBQUVwRSxRQUFRLENBQUMsc0JBQXNCLEVBQUU7SUFDL0IsUUFBUSxDQUFDLFlBQVksRUFBRTtRQUVyQixJQUFNLFdBQVcsR0FBRyxxQkFBRyxvRkFBQSxTQUFTLElBQUEsQ0FBQztRQUVqQyxFQUFFLENBQUMsMENBQTBDLEVBQUU7WUFDN0MsSUFBTSxPQUFPLEdBQUcsSUFBSSwyQkFBWSxFQUFFLENBQUM7WUFDbkMsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDbEYsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFFbEYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsa0RBQWtELEVBQUU7WUFDckQsSUFBTSxPQUFPLEdBQUcsSUFBSSwyQkFBWSxFQUFFLENBQUM7WUFDbkMsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZHLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV2RyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxpREFBaUQsRUFBRTtZQUNwRCxJQUFNLE9BQU8sR0FBRyxJQUFJLDJCQUFZLEVBQUUsQ0FBQztZQUNuQyxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDeEcsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXhHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxnREFBZ0QsRUFBRTtZQUNuRCxJQUFNLE9BQU8sR0FBRyxJQUFJLDJCQUFZLEVBQUUsQ0FBQztZQUNuQyxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdkcsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXZHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywrQ0FBK0MsRUFBRTtZQUNsRCxJQUFNLE9BQU8sR0FBRyxJQUFJLDJCQUFZLEVBQUUsQ0FBQztZQUNuQyxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdkcsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFFbEYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9