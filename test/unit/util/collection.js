"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var collection_1 = require("../../../src/util/collection");
describe("util.collection", function () {
    describe('lazyImmutableDeepSet', function () {
        it("constructs a new object if there is no target or original", function () {
            var updated = collection_1.lazyImmutableDeepSet(undefined, undefined, ['id'], 1);
            expect(updated).to.deep.eq({ id: 1 });
        });
        it("doesn't modify the original", function () {
            var original = { id: 1 };
            var updated = collection_1.lazyImmutableDeepSet(undefined, original, ['name'], 'hi');
            expect(original).to.deep.eq({ id: 1 });
            expect(updated).to.deep.eq({ id: 1, name: 'hi' });
        });
        it("doesn't modify nested objects", function () {
            var original = { id: 1, deep: { value: 1 } };
            var updated = collection_1.lazyImmutableDeepSet(undefined, original, ['deep', 'value'], 2);
            expect(original).to.deep.eq({ id: 1, deep: { value: 1 } });
            expect(updated).to.deep.eq({ id: 1, deep: { value: 2 } });
        });
        it("doesn't modify nested arrays", function () {
            var original = { id: 1, list: [1, 2, 3] };
            var updated = collection_1.lazyImmutableDeepSet(undefined, original, ['list', 1], 222);
            expect(original).to.deep.eq({ id: 1, list: [1, 2, 3] });
            expect(updated).to.deep.eq({ id: 1, list: [1, 222, 3] });
        });
        it("doesn't modify deeply nested arrays and objects", function () {
            var original = {
                one: {
                    two: [
                        0,
                        1,
                        2,
                        {
                            four: [0, 1, 2, 3, 4, 5, 6],
                        },
                        4,
                        5,
                    ],
                },
            };
            var updated = collection_1.lazyImmutableDeepSet(undefined, original, ['one', 'two', 3, 'four', 5], 555);
            expect(original).to.deep.eq({
                one: {
                    two: [
                        0,
                        1,
                        2,
                        {
                            four: [0, 1, 2, 3, 4, 5, 6],
                        },
                        4,
                        5,
                    ],
                },
            });
            expect(updated).to.deep.eq({
                one: {
                    two: [
                        0,
                        1,
                        2,
                        {
                            four: [0, 1, 2, 3, 4, 555, 6],
                        },
                        4,
                        5,
                    ],
                },
            });
        });
        it("doesn't re-create the target if it already differs from the original", function () {
            var original = { id: 1 };
            var updated1 = collection_1.lazyImmutableDeepSet(undefined, original, ['name'], 'hi');
            var updated2 = collection_1.lazyImmutableDeepSet(updated1, original, ['fizz'], 'buzz');
            expect(updated1).to.eq(updated2);
            expect(updated2).to.deep.eq({ id: 1, name: 'hi', fizz: 'buzz' });
        });
        it("doesn't re-create nested objects if they already differ from the original", function () {
            var original = { id: 1, deep: { value: 1 } };
            var updated1 = collection_1.lazyImmutableDeepSet(undefined, original, ['deep', 'value'], 2);
            var updated2 = collection_1.lazyImmutableDeepSet(updated1, original, ['deep', 'extra'], 3);
            expect(updated1).to.eq(updated2);
            expect(updated2).to.deep.eq({ id: 1, deep: { value: 2, extra: 3 } });
        });
        it("doesn't re-create nested arrays if they already differ from the original", function () {
            var original = { id: 1, list: [1, 2, 3] };
            var updated1 = collection_1.lazyImmutableDeepSet(undefined, original, ['list', 0], 111);
            var updated2 = collection_1.lazyImmutableDeepSet(updated1, original, ['list', 2], 333);
            expect(updated1).to.eq(updated2);
            expect(updated2).to.deep.eq({ id: 1, list: [111, 2, 333] });
        });
        it("doesn't re-create deeply nested arrays and objects if they already differ from the original", function () {
            var original = {
                one: {
                    two: [
                        0,
                        1,
                        2,
                        {
                            four: [0, 1, 2, 3, 4, 5, 6],
                        },
                        4,
                        5,
                    ],
                },
            };
            var updated1 = collection_1.lazyImmutableDeepSet(undefined, original, ['one', 'two', 3, 'four', 5], 555);
            var updated2 = collection_1.lazyImmutableDeepSet(updated1, original, ['one', 'two', 3, 'four', 4], 444);
            expect(updated1).to.eq(updated2);
            expect(updated2).to.deep.eq({
                one: {
                    two: [
                        0,
                        1,
                        2,
                        {
                            four: [0, 1, 2, 3, 444, 555, 6],
                        },
                        4,
                        5,
                    ],
                },
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyREFBb0U7QUFFcEUsUUFBUSxDQUFDLGlCQUFpQixFQUFFO0lBQzFCLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRTtRQUUvQixFQUFFLENBQUMsMkRBQTJELEVBQUU7WUFDOUQsSUFBTSxPQUFPLEdBQUcsaUNBQW9CLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDZCQUE2QixFQUFFO1lBQ2hDLElBQU0sUUFBUSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQzNCLElBQU0sT0FBTyxHQUFHLGlDQUFvQixDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLCtCQUErQixFQUFFO1lBQ2xDLElBQU0sUUFBUSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLEVB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