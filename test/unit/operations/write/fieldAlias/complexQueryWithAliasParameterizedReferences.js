"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var SnapshotEditor_1 = require("../../../../../src/operations/SnapshotEditor");
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
    describe("complex query with alias parameterized references", function () {
        var snapshot;
        beforeAll(function () {
            var aliasQuery = helpers_1.query("{\n        fullUser: user(id: 4) {\n          id\n          FirstName: name\n          contact: contactInfo {\n            shortAddress: address {\n              city\n              state\n            }\n            phone\n          }\n        }\n        shortUser: user (id: 4) {\n          id\n          FirstName: name\n          contact: contactInfo {\n            phone\n          }\n        }\n        user (id: 4) {\n          id\n          name\n        }\n      }");
            snapshot = write_1.write(context, empty, aliasQuery, {
                fullUser: {
                    id: 4,
                    FirstName: 'Foo',
                    contact: {
                        shortAddress: {
                            city: 'ABA',
                            state: 'AA',
                        },
                        phone: '555-555-5555',
                    },
                },
                shortUser: {
                    id: 4,
                    FirstName: 'Foo',
                    contact: {
                        phone: '555-555-5555',
                    },
                },
                user: {
                    id: 4,
                    name: 'Foo',
                },
            }).snapshot;
        });
        it("only writes fields from the schema", function () {
            var parameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['user'], { id: 4 });
            expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({
                id: 4,
                name: 'Foo',
                contactInfo: {
                    address: {
                        city: 'ABA',
                        state: 'AA',
                    },
                    phone: '555-555-5555',
                },
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxleFF1ZXJ5V2l0aEFsaWFzUGFyYW1ldGVyaXplZFJlZmVyZW5jZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb21wbGV4UXVlcnlXaXRoQWxpYXNQYXJhbWV0ZXJpemVkUmVmZXJlbmNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUEwRDtBQUMxRCxrRUFBaUU7QUFDakUsK0VBQTJGO0FBQzNGLDZEQUE0RDtBQUM1RCxvREFBeUQ7QUFDekQsK0NBQTBEO0FBRWxELElBQUEsNkNBQXNCLENBQWtCO0FBRWhELGdGQUFnRjtBQUNoRixFQUFFO0FBQ0YsNkVBQTZFO0FBQzdFLGdGQUFnRjtBQUNoRixRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFFM0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyxJQUFNLEtBQUssR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztJQUVsQyxRQUFRLENBQUMsbURBQW1ELEVBQUU7UUFFNUQsSUFBSSxRQUF1QixDQUFDO1FBQzVCLFNBQVMsQ0FBQztZQUNSLElBQU0sVUFBVSxHQUFHLGVBQUssQ0FBQywwZEF1QnZCLENBQUMsQ0FBQztZQUVKLFFBQVEsR0FBRyxhQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7Z0JBQzNDLFFBQVEsRUFBRTtvQkFDUixFQUFFLEVBQUUsQ0FBQztvQkFDTCxTQUFTLEVBQUUsS0FBSztvQkFDaEIsT0FBTyxFQUFFO3dCQUNQLFlBQVksRUFBRTs0QkFDWixJQUFJLEVBQUUsS0FBSzs0QkFDWCxLQUFLLEVBQUUsSUFBSTt5QkFDWjt3QkFDRCxLQUFLLEVBQUUsY0FBYztxQkFDdEI7aUJBQ0Y7Z0JBQ0QsU0FBUyxFQUFFO29CQUNULEVBQUUsRUFBRSxDQUFDO29CQUNMLFNBQVMsRUFBRSxLQUFLO29CQUNoQixPQUFPLEVBQUU7d0JBQ1AsS0FBSyxFQUFFLGNBQWM7cUJBQ3RCO2lCQUNGO2dCQUNELElBQUksRUFBRTtvQkFDSixFQUFFLEVBQUUsQ0FBQztvQkFDTCxJQUFJLEVBQUUsS0FBSztpQkFDWjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtZQUN2QyxJQUFNLGVBQWUsR0FBRyw0Q0FBMkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELEVBQUUsRUFBRSxDQUFDO2dCQUNMLElBQUksRUFBRSxLQUFLO2dCQUNYLFdBQVcsRUFBRTtvQkFDWCxPQUFPLEVBQUU7d0JBQ1AsSUFBSSxFQUFFLEtBQUs7d0JBQ1gsS0FBSyxFQUFFLElBQUk7cUJBQ1o7b0JBQ0QsS0FBSyxFQUFFLGNBQWM7aUJBQ3RCO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=