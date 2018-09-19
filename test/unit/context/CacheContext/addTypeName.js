"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var graphql_tag_1 = require("graphql-tag");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var helpers_1 = require("../../../helpers");
describe("context.CacheContext", function () {
    describe("addTypename", function () {
        function transformDocument(context, operation) {
            return context.parseOperation({
                rootId: 'abc',
                document: context.transformDocument(graphql_tag_1.default(operation)),
            });
        }
        function fieldNames(selectionSet) {
            var names = [];
            try {
                for (var _a = tslib_1.__values(selectionSet.selections), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var selection = _b.value;
                    if (selection.kind !== 'Field')
                        continue;
                    names.push(selection.name.value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return names;
            var e_1, _c;
        }
        it("does not inject __typename by default", function () {
            var context = new CacheContext_1.CacheContext(helpers_1.strictConfig);
            var parsed = transformDocument(context, "{\n        foo {\n          bar { a b }\n        }\n      }");
            var rootSelection = parsed.info.operation.selectionSet;
            expect(fieldNames(rootSelection)).to.have.members(['foo']);
            var fooSelection = rootSelection.selections[0].selectionSet;
            expect(fieldNames(fooSelection)).to.have.members(['bar']);
            var barSelection = fooSelection.selections.find(function (s) { return s.name.value === 'bar'; }).selectionSet;
            expect(fieldNames(barSelection)).to.have.members(['a', 'b']);
        });
        it("injects __typename into parsed queries", function () {
            var context = new CacheContext_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { addTypename: true }));
            var parsed = transformDocument(context, "{\n        foo {\n          bar { a b }\n        }\n      }");
            var rootSelection = parsed.info.operation.selectionSet;
            expect(fieldNames(rootSelection)).to.have.members(['foo']);
            var fooSelection = rootSelection.selections[0].selectionSet;
            expect(fieldNames(fooSelection)).to.have.members(['__typename', 'bar']);
            var barSelection = fooSelection.selections.find(function (s) { return s.name.value === 'bar'; }).selectionSet;
            expect(fieldNames(barSelection)).to.have.members(['__typename', 'a', 'b']);
        });
        it("injects __typename into fragments", function () {
            var context = new CacheContext_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { addTypename: true }));
            var parsed = transformDocument(context, "\n        query stuff {\n          foo {\n            __typename\n            ...fullFoo\n          }\n        }\n\n        fragment fullFoo on Foo { bar }\n      ");
            var rootSelection = parsed.info.operation.selectionSet;
            expect(fieldNames(rootSelection)).to.have.members(['foo']);
            var fooSelection = rootSelection.selections[0].selectionSet;
            expect(fieldNames(fooSelection)).to.have.members(['__typename']);
            var fullFooSelection = parsed.info.fragmentMap['fullFoo'].selectionSet;
            expect(fieldNames(fullFooSelection)).to.have.members(['__typename', 'bar']);
        });
        it("injects __typename into inline fragments", function () {
            var context = new CacheContext_1.CacheContext(tslib_1.__assign({}, helpers_1.silentConfig, { addTypename: true }));
            var parsed = transformDocument(context, "{\n        asdf {\n        ... on Foo { a }\n        ... on Bar { b }\n          }\n      }");
            var rootSelection = parsed.info.operation.selectionSet;
            expect(fieldNames(rootSelection)).to.have.members(['asdf']);
            var asdfSelection = rootSelection.selections[0].selectionSet;
            expect(fieldNames(asdfSelection)).to.have.members(['__typename']);
            var fooSelection = asdfSelection.selections[0].selectionSet;
            expect(fieldNames(fooSelection)).to.have.members(['__typename', 'a']);
            var barSelection = asdfSelection.selections[1].selectionSet;
            expect(fieldNames(barSelection)).to.have.members(['__typename', 'b']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkVHlwZU5hbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhZGRUeXBlTmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwyQ0FBOEI7QUFFOUIscUVBQW9FO0FBQ3BFLDRDQUE4RDtBQUU5RCxRQUFRLENBQUMsc0JBQXNCLEVBQUU7SUFDL0IsUUFBUSxDQUFDLGFBQWEsRUFBRTtRQUN0QiwyQkFBMkIsT0FBcUIsRUFBRSxTQUFpQjtZQUNqRSxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQztnQkFDNUIsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsUUFBUSxFQUFFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ3BELENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxvQkFBb0IsWUFBOEI7WUFDaEQsSUFBTSxLQUFLLEdBQUcsRUFBYyxDQUFDOztnQkFDN0IsR0FBRyxDQUFDLENBQW9CLElBQUEsS0FBQSxpQkFBQSxZQUFZLENBQUMsVUFBVSxDQUFBLGdCQUFBO29CQUExQyxJQUFNLFNBQVMsV0FBQTtvQkFDbEIsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxPQUFPLENBQUM7d0JBQUMsUUFBUSxDQUFDO29CQUN6QyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ2xDOzs7Ozs7Ozs7WUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDOztRQUNmLENBQUM7UUFFRCxFQUFFLENBQUMsdUNBQXVDLEVBQUU7WUFDMUMsSUFBTSxPQUFPLEdBQUcsSUFBSSwyQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztZQUMvQyxJQUFNLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsNkRBSXhDLENBQUMsQ0FBQztZQUVKLElBQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztZQUN6RCxNQUFNLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRTNELElBQU0sWUFBWSxHQUFJLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFTLENBQUMsWUFBWSxDQUFDO1lBQ3ZFLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFMUQsSUFBTSxZQUFZLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFNLElBQUssT0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLEVBQXRCLENBQXNCLENBQUMsQ0FBQyxZQUFZLENBQUM7WUFDbkcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsd0NBQXdDLEVBQUU7WUFDM0MsSUFBTSxPQUFPLEdBQUcsSUFBSSwyQkFBWSxzQkFBTSxzQkFBWSxJQUFFLFdBQVcsRUFBRSxJQUFJLElBQUcsQ0FBQztZQUN6RSxJQUFNLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsNkRBSXhDLENBQUMsQ0FBQztZQUVKLElBQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztZQUN6RCxNQUFNLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRTNELElBQU0sWUFBWSxHQUFJLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFTLENBQUMsWUFBWSxDQUFDO1lBQ3ZFLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRXhFLElBQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQUMsQ0FBTSxJQUFLLE9BQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxFQUF0QixDQUFzQixDQUFDLENBQUMsWUFBWSxDQUFDO1lBQ25HLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM3RSxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRTtZQUN0QyxJQUFNLE9BQU8sR0FBRyxJQUFJLDJCQUFZLHNCQUFNLHNCQUFZLElBQUUsV0FBVyxFQUFFLElBQUksSUFBRyxDQUFDO1lBQ3pFLElBQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxxS0FTekMsQ0FBQyxDQUFDO1lBRUgsSUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFM0QsSUFBTSxZQUFZLEdBQUksYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQVMsQ0FBQyxZQUFZLENBQUM7WUFDdkUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUVqRSxJQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFlBQVksQ0FBQztZQUN6RSxNQUFNLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzlFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDBDQUEwQyxFQUFFO1lBQzdDLElBQU0sT0FBTyxHQUFHLElBQUksMkJBQVksc0JBQU0sc0JBQVksSUFBRSxXQUFXLEVBQUUsSUFBSSxJQUFHLENBQUM7WUFDekUsSUFBTSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxFQUFFLDZGQUt4QyxDQUFDLENBQUM7WUFFSixJQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUM7WUFDekQsTUFBTSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUU1RCxJQUFNLGFBQWEsR0FBSSxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBUyxDQUFDLFlBQVksQ0FBQztZQUN4RSxNQUFNLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBRWxFLElBQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO1lBQzlELE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRXRFLElBQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO1lBQzlELE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9