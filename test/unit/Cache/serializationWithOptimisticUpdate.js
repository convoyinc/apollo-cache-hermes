"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cache_1 = require("../../../src/Cache");
var helpers_1 = require("../../helpers");
describe("serialization with optimistic update", function () {
    var getAFooQuery = helpers_1.query("query getAFoo($id: ID!) {\n    one {\n      two {\n        three(id: $id, withExtra: true) {\n          id name extraValue\n        }\n      }\n    }\n  }", { id: 1 });
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
        // Mock optimistic baseline
        var updateQuery = helpers_1.query("{ id name extraValue }", 
        /* variables */ undefined, '31');
        cache.transaction(
        /* changeId */ '31', function (transaction) {
            transaction.write(updateQuery, {
                id: '31',
                name: 'NEW-Three1',
                extraValue: null,
            });
        });
        originalCacheSnapshot = cache.getSnapshot();
        extractResult = cache.extract(/* optimistic */ true);
        storedExtractResult = JSON.stringify(extractResult);
    });
    it("extract, stringify, and restore cache", function () {
        var newCache = new Cache_1.Cache();
        newCache.restore(JSON.parse(storedExtractResult));
        expect(newCache.getSnapshot().baseline).to.deep.eq(originalCacheSnapshot.optimistic);
    });
    it("extract and restore cache without JSON.stringify", function () {
        var newCache = new Cache_1.Cache();
        expect(function () {
            newCache.restore(extractResult);
        }).to.throw(/Unexpected 'undefined'/);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXphdGlvbldpdGhPcHRpbWlzdGljVXBkYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VyaWFsaXphdGlvbldpdGhPcHRpbWlzdGljVXBkYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNENBQTJDO0FBRzNDLHlDQUFvRDtBQUVwRCxRQUFRLENBQUMsc0NBQXNDLEVBQUU7SUFFL0MsSUFBTSxZQUFZLEdBQUksZUFBSyxDQUFDLDRKQVExQixFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFZixJQUFJLHFCQUFvQyxFQUFFLGFBQXlDLEVBQUUsbUJBQTJCLENBQUM7SUFDakgsVUFBVSxDQUFDO1FBQ1QsSUFBTSxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsc0JBQVksQ0FBQyxDQUFDO1FBQ3RDLEtBQUssQ0FBQyxLQUFLLENBQ1QsWUFBWSxFQUNaO1lBQ0UsR0FBRyxFQUFFO2dCQUNILEdBQUcsRUFBRTtvQkFDSDt3QkFDRSxLQUFLLEVBQUU7NEJBQ0wsRUFBRSxFQUFFLElBQUk7NEJBQ1IsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsVUFBVSxFQUFFLE9BQU87eUJBQ3BCO3FCQUNGO29CQUNEO3dCQUNFLEtBQUssRUFBRTs0QkFDTCxFQUFFLEVBQUUsSUFBSTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxVQUFVLEVBQUUsT0FBTzt5QkFDcEI7cUJBQ0Y7b0JBQ0QsSUFBSTtpQkFDTDthQUNGO1NBQ0YsQ0FDRixDQUFDO1FBRUYsMkJBQTJCO1FBQzNCLElBQU0sV0FBVyxHQUFHLGVBQUssQ0FDdkIsd0JBQXdCO1FBQ3hCLGVBQWUsQ0FBQyxTQUFTLEVBQ3pCLElBQUksQ0FDTCxDQUFDO1FBRUYsS0FBSyxDQUFDLFdBQVc7UUFDZixjQUFjLENBQUMsSUFBSSxFQUNuQixVQUFDLFdBQVc7WUFDVixXQUFXLENBQUMsS0FBSyxDQUNmLFdBQVcsRUFDWDtnQkFDRSxFQUFFLEVBQUUsSUFBSTtnQkFDUixJQUFJLEVBQUUsWUFBWTtnQkFDbEIsVUFBVSxFQUFFLElBQUk7YUFDakIsQ0FDRixDQUFDO1FBQ0osQ0FBQyxDQUNGLENBQUM7UUFFRixxQkFBcUIsR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDNUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckQsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN0RCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRTtRQUMxQyxJQUFNLFFBQVEsR0FBRyxJQUFJLGFBQUssRUFBRSxDQUFDO1FBQzdCLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFDbEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUN2RixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxrREFBa0QsRUFBRTtRQUNyRCxJQUFNLFFBQVEsR0FBRyxJQUFJLGFBQUssRUFBRSxDQUFDO1FBQzdCLE1BQU0sQ0FBQztZQUNMLFFBQVEsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBQ3hDLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMifQ==