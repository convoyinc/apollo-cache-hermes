"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cache_1 = require("../../../src/Cache");
var helpers_1 = require("../../helpers");
describe("serialization without optimistic update", function () {
    var getAFooQuery = helpers_1.query("query getAFoo($id: ID!) {\n    one {\n      two {\n        three(id: $id, withExtra: true) {\n          id name extraValue\n        }\n      }\n    }\n  }", { id: 0 });
    var originalCacheSnapshot, extractResult, storedExtractResult;
    beforeEach(function () {
        var cache = new Cache_1.Cache(helpers_1.strictConfig);
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
        extractResult = cache.extract(/* optimistic */ false);
        storedExtractResult = JSON.stringify(extractResult);
    });
    it("extract, stringify, and restore cache", function () {
        var newCache = new Cache_1.Cache();
        newCache.restore(JSON.parse(storedExtractResult));
        expect(newCache.getSnapshot()).to.deep.eq(originalCacheSnapshot);
    });
    it("extract and restore cache without JSON.stringify", function () {
        var newCache = new Cache_1.Cache();
        expect(function () {
            newCache.restore(extractResult);
        }).to.throw(/Unexpected 'undefined'/);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXphdGlvbldpdGhPdXRPcHRpbWlzdGljVXBkYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VyaWFsaXphdGlvbldpdGhPdXRPcHRpbWlzdGljVXBkYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNENBQTJDO0FBRzNDLHlDQUFvRDtBQUVwRCxRQUFRLENBQUMseUNBQXlDLEVBQUU7SUFFbEQsSUFBTSxZQUFZLEdBQUksZUFBSyxDQUFDLDRKQVExQixFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFZixJQUFJLHFCQUFvQyxFQUFFLGFBQXlDLEVBQUUsbUJBQTJCLENBQUM7SUFDakgsVUFBVSxDQUFDO1FBQ1QsSUFBTSxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsc0JBQVksQ0FBQyxDQUFDO1FBQ3RDLEtBQUssQ0FBQyxLQUFLLENBQ1QsWUFBWSxFQUNaO1lBQ0UsR0FBRyxFQUFFO2dCQUNILEdBQUcsRUFBRTtvQkFDSDt3QkFDRSxLQUFLLEVBQUU7NEJBQ0wsRUFBRSxFQUFFLElBQUk7NEJBQ1IsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsVUFBVSxFQUFFLE9BQU87eUJBQ3BCO3FCQUNGO29CQUNEO3dCQUNFLEtBQUssRUFBRTs0QkFDTCxFQUFFLEVBQUUsSUFBSTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxVQUFVLEVBQUUsT0FBTzt5QkFDcEI7cUJBQ0Y7b0JBQ0QsSUFBSTtpQkFDTDthQUNGO1NBQ0YsQ0FDRixDQUFDO1FBQ0YscUJBQXFCLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzVDLGFBQWEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RELG1CQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDdEQsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsdUNBQXVDLEVBQUU7UUFDMUMsSUFBTSxRQUFRLEdBQUcsSUFBSSxhQUFLLEVBQUUsQ0FBQztRQUM3QixRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ25FLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGtEQUFrRCxFQUFFO1FBQ3JELElBQU0sUUFBUSxHQUFHLElBQUksYUFBSyxFQUFFLENBQUM7UUFDN0IsTUFBTSxDQUFDO1lBQ0wsUUFBUSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDeEMsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9