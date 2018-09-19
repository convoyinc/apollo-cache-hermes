"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cache_1 = require("../../../src/Cache");
var helpers_1 = require("../../helpers");
describe("serialization with pruning", function () {
    var getAFooQuery = helpers_1.query("query getAFoo($id: ID!) {\n    one {\n      two {\n        three(id: $id, withExtra: true) {\n          id name extraValue\n        }\n      }\n    }\n  }", { id: 0 });
    var originalCacheSnapshot, cache;
    beforeEach(function () {
        cache = new Cache_1.Cache(helpers_1.strictConfig);
        cache.write(getAFooQuery, {
            one: {
                two: [
                    {
                        three: {
                            id: '30',
                            name: 'Three0',
                            extraValue: '30-42',
                        },
                    },
                    {
                        three: {
                            id: '31',
                            name: 'Three1',
                            extraValue: '31-42',
                        },
                    },
                    null,
                ],
            },
        });
        originalCacheSnapshot = cache.getSnapshot();
    });
    it("extracts only the sub-branch specified by the prune query", function () {
        // first muddy up the cache with another query
        var muddyQuery = helpers_1.query("query muddy {\n      viewer {\n        id\n        first\n        last\n        carrier {\n          id\n          hqCity\n          phoneNo\n        }\n      }\n    }");
        cache.write(muddyQuery, {
            viewer: {
                id: 'tough007',
                first: 'James',
                last: 'Bond',
                carrier: {
                    id: 'mi5',
                    hqCity: 'London',
                    phoneNo: '+44 20 7946 0820',
                },
            },
        });
        // extract but prune it with 'getAFooQuery'
        var extractResult = cache.extract(/* optimistic */ false, getAFooQuery);
        var storedExtractResult = JSON.stringify(extractResult);
        var newCache = new Cache_1.Cache();
        newCache.restore(JSON.parse(storedExtractResult));
        // the restored cache should look as if muddyQuery never happens
        expect(newCache.getSnapshot()).to.deep.eq(originalCacheSnapshot);
    });
    it("can extract the cache with slightly trimmed 'three' object", function () {
        // set up an alternative query in which the 'three' object doesn't have
        // the 'name' field
        var altPruneQuery = helpers_1.query("query getAFoo($id: ID!) {\n      one {\n        two {\n          three(id: $id, withExtra: true) {\n            id extraValue\n          }\n        }\n      }\n    }", { id: 0 });
        // build the expected cache
        var expectedCache = new Cache_1.Cache(helpers_1.strictConfig);
        expectedCache.write(altPruneQuery, {
            one: {
                two: [
                    {
                        three: {
                            id: '30',
                            extraValue: '30-42',
                        },
                    },
                    {
                        three: {
                            id: '31',
                            extraValue: '31-42',
                        },
                    },
                    null,
                ],
            },
        });
        // prune the original cache
        var extractResult = cache.extract(/* optimistic */ false, altPruneQuery);
        var storedExtractResult = JSON.stringify(extractResult);
        var newCache = new Cache_1.Cache();
        newCache.restore(JSON.parse(storedExtractResult));
        // the restored cache should look as if it is built up from scrach with
        // altPruneQuery
        expect(newCache.getSnapshot()).to.deep.eq(expectedCache.getSnapshot());
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXphdGlvbldpdGhQcnVuaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VyaWFsaXphdGlvbldpdGhQcnVuaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNENBQTJDO0FBRTNDLHlDQUFvRDtBQUVwRCxRQUFRLENBQUMsNEJBQTRCLEVBQUU7SUFFckMsSUFBTSxZQUFZLEdBQUcsZUFBSyxDQUFDLDRKQVF6QixFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFZixJQUFJLHFCQUFvQyxFQUFFLEtBQVksQ0FBQztJQUN2RCxVQUFVLENBQUM7UUFDVCxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsc0JBQVksQ0FBQyxDQUFDO1FBQ2hDLEtBQUssQ0FBQyxLQUFLLENBQ1QsWUFBWSxFQUNaO1lBQ0UsR0FBRyxFQUFFO2dCQUNILEdBQUcsRUFBRTtvQkFDSDt3QkFDRSxLQUFLLEVBQUU7NEJBQ0wsRUFBRSxFQUFFLElBQUk7NEJBQ1IsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsVUFBVSxFQUFFLE9BQU87eUJBQ3BCO3FCQUNGO29CQUNEO3dCQUNFLEtBQUssRUFBRTs0QkFDTCxFQUFFLEVBQUUsSUFBSTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxVQUFVLEVBQUUsT0FBTzt5QkFDcEI7cUJBQ0Y7b0JBQ0QsSUFBSTtpQkFDTDthQUNGO1NBQ0YsQ0FDRixDQUFDO1FBQ0YscUJBQXFCLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzlDLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDJEQUEyRCxFQUFFO1FBQzlELDhDQUE4QztRQUM5QyxJQUFNLFVBQVUsR0FBRyxlQUFLLENBQUMseUtBV3ZCLENBQUMsQ0FBQztRQUVKLEtBQUssQ0FBQyxLQUFLLENBQ1QsVUFBVSxFQUNWO1lBQ0UsTUFBTSxFQUFFO2dCQUNOLEVBQUUsRUFBRSxVQUFVO2dCQUNkLEtBQUssRUFBRSxPQUFPO2dCQUNkLElBQUksRUFBRSxNQUFNO2dCQUNaLE9BQU8sRUFBRTtvQkFDUCxFQUFFLEVBQUUsS0FBSztvQkFDVCxNQUFNLEVBQUUsUUFBUTtvQkFDaEIsT0FBTyxFQUFFLGtCQUFrQjtpQkFDNUI7YUFDRjtTQUNGLENBQ0YsQ0FBQztRQUVGLDJDQUEyQztRQUMzQyxJQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMxRSxJQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFMUQsSUFBTSxRQUFRLEdBQUcsSUFBSSxhQUFLLEVBQUUsQ0FBQztRQUM3QixRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1FBRWxELGdFQUFnRTtRQUNoRSxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUNuRSxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw0REFBNEQsRUFBRTtRQUMvRCx1RUFBdUU7UUFDdkUsbUJBQW1CO1FBQ25CLElBQU0sYUFBYSxHQUFHLGVBQUssQ0FBQyx1S0FRMUIsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRWYsMkJBQTJCO1FBQzNCLElBQU0sYUFBYSxHQUFHLElBQUksYUFBSyxDQUFDLHNCQUFZLENBQUMsQ0FBQztRQUM5QyxhQUFhLENBQUMsS0FBSyxDQUNqQixhQUFhLEVBQ2I7WUFDRSxHQUFHLEVBQUU7Z0JBQ0gsR0FBRyxFQUFFO29CQUNIO3dCQUNFLEtBQUssRUFBRTs0QkFDTCxFQUFFLEVBQUUsSUFBSTs0QkFDUixVQUFVLEVBQUUsT0FBTzt5QkFDcEI7cUJBQ0Y7b0JBQ0Q7d0JBQ0UsS0FBSyxFQUFFOzRCQUNMLEVBQUUsRUFBRSxJQUFJOzRCQUNSLFVBQVUsRUFBRSxPQUFPO3lCQUNwQjtxQkFDRjtvQkFDRCxJQUFJO2lCQUNMO2FBQ0Y7U0FDRixDQUNGLENBQUM7UUFFRiwyQkFBMkI7UUFDM0IsSUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDM0UsSUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRTFELElBQU0sUUFBUSxHQUFHLElBQUksYUFBSyxFQUFFLENBQUM7UUFDN0IsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztRQUVsRCx1RUFBdUU7UUFDdkUsZ0JBQWdCO1FBQ2hCLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUN6RSxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=