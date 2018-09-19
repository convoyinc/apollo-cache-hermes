"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var write_1 = require("../../../../../src/operations/write");
var schema_1 = require("../../../../../src/schema");
var helpers_1 = require("../../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe("operations.write", function () {
    var context = new context_1.CacheContext(helpers_1.strictConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    describe("complex nested query with alias values", function () {
        var snapshot;
        beforeAll(function () {
            var nestedAliasQuery = helpers_1.query("\n        query GetUser {\n          fullUserInfo: user {\n            userId: id\n            nickName\n            FirstName: name\n            contact {\n              address: homeAddress {\n                city\n                state\n              }\n              phone\n            }\n          }\n        }\n      ");
            snapshot = write_1.write(context, empty, nestedAliasQuery, {
                fullUserInfo: {
                    userId: 0,
                    nickName: 'Foo Foo',
                    FirstName: 'Foo',
                    contact: {
                        address: {
                            city: 'Seattle',
                            state: 'WA',
                        },
                        phone: '555-555-5555',
                    },
                },
            }).snapshot;
        });
        it("only writes fields from the schema", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                user: {
                    id: 0,
                    name: 'Foo',
                    nickName: 'Foo Foo',
                    contact: {
                        homeAddress: {
                            city: 'Seattle',
                            state: 'WA',
                        },
                        phone: '555-555-5555',
                    },
                },
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxleE5lc3RlZFF1ZXJ5V2l0aEFsaWFzVmFsdWVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tcGxleE5lc3RlZFF1ZXJ5V2l0aEFsaWFzVmFsdWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0RBQTBEO0FBQzFELGtFQUFpRTtBQUNqRSw2REFBNEQ7QUFDNUQsb0RBQXlEO0FBQ3pELCtDQUEwRDtBQUVsRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBRTNCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFFbEMsUUFBUSxDQUFDLHdDQUF3QyxFQUFFO1FBRWpELElBQUksUUFBdUIsQ0FBQztRQUM1QixTQUFTLENBQUM7WUFDUixJQUFNLGdCQUFnQixHQUFHLGVBQUssQ0FBQyxxVUFlOUIsQ0FBQyxDQUFDO1lBRUgsUUFBUSxHQUFHLGFBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFO2dCQUNqRCxZQUFZLEVBQUU7b0JBQ1osTUFBTSxFQUFFLENBQUM7b0JBQ1QsUUFBUSxFQUFFLFNBQVM7b0JBQ25CLFNBQVMsRUFBRSxLQUFLO29CQUNoQixPQUFPLEVBQUU7d0JBQ1AsT0FBTyxFQUFFOzRCQUNQLElBQUksRUFBRSxTQUFTOzRCQUNmLEtBQUssRUFBRSxJQUFJO3lCQUNaO3dCQUNELEtBQUssRUFBRSxjQUFjO3FCQUN0QjtpQkFDRjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtZQUN2QyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxJQUFJLEVBQUU7b0JBQ0osRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLEtBQUs7b0JBQ1gsUUFBUSxFQUFFLFNBQVM7b0JBQ25CLE9BQU8sRUFBRTt3QkFDUCxXQUFXLEVBQUU7NEJBQ1gsSUFBSSxFQUFFLFNBQVM7NEJBQ2YsS0FBSyxFQUFFLElBQUk7eUJBQ1o7d0JBQ0QsS0FBSyxFQUFFLGNBQWM7cUJBQ3RCO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=