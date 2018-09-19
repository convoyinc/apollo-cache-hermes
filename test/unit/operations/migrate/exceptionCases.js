"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var CacheSnapshot_1 = require("../../../../src/CacheSnapshot");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var operations_1 = require("../../../../src/operations");
var OptimisticUpdateQueue_1 = require("../../../../src/OptimisticUpdateQueue");
var helpers_1 = require("../../../helpers");
describe("operations.migrate", function () {
    var cacheContext;
    var cacheSnapshot;
    beforeAll(function () {
        cacheContext = new CacheContext_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { freeze: false }));
        var snapshot = helpers_1.createGraphSnapshot({
            foo: 123,
            bar: 'asdf',
            viewer: {
                id: 'a',
                first: 'Jonh',
                last: 'Doe',
                __typename: 'Viewer',
            },
        }, "{ foo bar viewer { id first last __typename } }", cacheContext);
        cacheSnapshot = new CacheSnapshot_1.CacheSnapshot(snapshot, snapshot, new OptimisticUpdateQueue_1.OptimisticUpdateQueue());
    });
    it("does nothing if no migration map is provided", function () {
        var migrated = operations_1.migrate(cacheSnapshot);
        var cacheAfter = operations_1.extract(migrated.baseline, cacheContext);
        expect(cacheAfter).to.be.deep.eq(operations_1.extract(cacheSnapshot.baseline, cacheContext));
    });
    it("throws if trying to migrate a reference field", function () {
        expect(function () {
            operations_1.migrate(cacheSnapshot, {
                _entities: {
                    Query: {
                        viewer: function (_previous) { return ''; },
                    },
                },
            });
        }).to.throw(/Migration is not allowed/i);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhjZXB0aW9uQ2FzZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJleGNlcHRpb25DYXNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrREFBOEQ7QUFDOUQscUVBQW9FO0FBQ3BFLHlEQUE4RDtBQUM5RCwrRUFBOEU7QUFFOUUsNENBQXFFO0FBRXJFLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRTtJQUM3QixJQUFJLFlBQTBCLENBQUM7SUFDL0IsSUFBSSxhQUE0QixDQUFDO0lBQ2pDLFNBQVMsQ0FBQztRQUNSLFlBQVksR0FBRyxJQUFJLDJCQUFZLHNCQUFNLHNCQUFZLElBQUUsTUFBTSxFQUFFLEtBQUssSUFBRyxDQUFDO1FBQ3BFLElBQU0sUUFBUSxHQUFHLDZCQUFtQixDQUNsQztZQUNFLEdBQUcsRUFBRSxHQUFHO1lBQ1IsR0FBRyxFQUFFLE1BQU07WUFDWCxNQUFNLEVBQUU7Z0JBQ04sRUFBRSxFQUFFLEdBQUc7Z0JBQ1AsS0FBSyxFQUFFLE1BQU07Z0JBQ2IsSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsVUFBVSxFQUFFLFFBQVE7YUFDckI7U0FDRixFQUNELGlEQUFpRCxFQUNqRCxZQUFZLENBQ2IsQ0FBQztRQUNGLGFBQWEsR0FBRyxJQUFJLDZCQUFhLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLDZDQUFxQixFQUFFLENBQUMsQ0FBQztJQUNyRixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw4Q0FBOEMsRUFBRTtRQUNqRCxJQUFNLFFBQVEsR0FBRyxvQkFBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3hDLElBQU0sVUFBVSxHQUFHLG9CQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUM1RCxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLG9CQUFPLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ2xGLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLCtDQUErQyxFQUFFO1FBQ2xELE1BQU0sQ0FBQztZQUNMLG9CQUFPLENBQUMsYUFBYSxFQUFFO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1QsS0FBSyxFQUFFO3dCQUNMLE1BQU0sRUFBRSxVQUFDLFNBQW9CLElBQUssT0FBQSxFQUFFLEVBQUYsQ0FBRTtxQkFDckM7aUJBQ0Y7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9