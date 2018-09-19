"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var src_1 = require("../../../../src");
describe("ast.selectionSetIsStatic", function () {
    function selection(source) {
        return graphql_tag_1.default(source).definitions[0].selectionSet;
    }
    it("considers truly static fragments as static", function () {
        expect(src_1.selectionSetIsStatic(selection("\n      fragment foo on Foo {\n        one\n        two {\n          three\n          four\n        }\n      }\n    "))).to.eq(true);
    });
    it("considers truly static operations as static", function () {
        expect(src_1.selectionSetIsStatic(selection("{\n      one\n      two {\n        three\n        four\n      }\n    }"))).to.eq(true);
    });
    it("considers aliases as dynamic", function () {
        expect(src_1.selectionSetIsStatic(selection("{\n      one: two\n    }"))).to.eq(false);
    });
    it("considers parameterized fields as dynamic", function () {
        expect(src_1.selectionSetIsStatic(selection("{\n      one(foo: 123)\n    }"))).to.eq(false);
    });
    it("honors @static when on aliased fields", function () {
        expect(src_1.selectionSetIsStatic(selection("{\n      one: two @static\n    }"))).to.eq(true);
    });
    it("honors @static when on parameterized fields", function () {
        expect(src_1.selectionSetIsStatic(selection("{\n      one(foo: 123) @static\n    }"))).to.eq(true);
    });
    it("honors @static on nested fields", function () {
        expect(src_1.selectionSetIsStatic(selection("{\n      one {\n        two {\n          three: foo @static\n          four(bar: 123) @static\n          five: baz(fizz: 321) @static\n        }\n      }\n    }"))).to.eq(true);
    });
    it("walks inline fragments", function () {
        expect(src_1.selectionSetIsStatic(selection("{\n      one {\n        ... on Foo {\n          three: foo\n        }\n      }\n    }"))).to.eq(false);
    });
    describe("selections with fragment spreads", function () {
        var mainSelection = selection("{\n      foo { ...Foo }\n    }");
        it("supports fragment walking", function () {
            var fragmentGetter = jest.fn(function () {
                return selection("{\n          one: foo\n          two(bar: 123)\n        }");
            });
            expect(src_1.selectionSetIsStatic(mainSelection, fragmentGetter)).to.eq(false);
            expect(fragmentGetter.mock.calls).to.deep.eq([
                ['Foo'],
            ]);
        });
        it("throws for missing fragments", function () {
            function fragmentGetter() {
                return undefined;
            }
            expect(function () {
                src_1.selectionSetIsStatic(mainSelection, fragmentGetter);
            }).to.throw(/fragment.*Foo/);
        });
        it("throws if you forget fragmentGetter", function () {
            expect(function () {
                src_1.selectionSetIsStatic(mainSelection);
            }).to.throw(/fragmentGetter/);
        });
        it("walks inline fragments that contain the spread", function () {
            var fragmentGetter = jest.fn(function () { return selection("{ one: foo }"); });
            expect(src_1.selectionSetIsStatic(selection("{\n        one {\n          ... on Foo {\n            ...Foo\n          }\n        }\n      }"), fragmentGetter)).to.eq(false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uU2V0SXNTdGF0aWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWxlY3Rpb25TZXRJc1N0YXRpYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE4QjtBQUU5Qix1Q0FBdUQ7QUFFdkQsUUFBUSxDQUFDLDBCQUEwQixFQUFFO0lBRW5DLG1CQUFtQixNQUFjO1FBQy9CLE1BQU0sQ0FBQyxxQkFBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7SUFDakQsQ0FBQztJQUVELEVBQUUsQ0FBQyw0Q0FBNEMsRUFBRTtRQUMvQyxNQUFNLENBQUMsMEJBQW9CLENBQUMsU0FBUyxDQUFDLHNIQVFyQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkIsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUU7UUFDaEQsTUFBTSxDQUFDLDBCQUFvQixDQUFDLFNBQVMsQ0FBQyx3RUFNcEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDhCQUE4QixFQUFFO1FBQ2pDLE1BQU0sQ0FBQywwQkFBb0IsQ0FBQyxTQUFTLENBQUMsMEJBRXBDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQywyQ0FBMkMsRUFBRTtRQUM5QyxNQUFNLENBQUMsMEJBQW9CLENBQUMsU0FBUyxDQUFDLCtCQUVwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckIsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsdUNBQXVDLEVB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