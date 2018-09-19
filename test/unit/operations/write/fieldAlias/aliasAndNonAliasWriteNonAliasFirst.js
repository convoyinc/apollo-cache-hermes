"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../../../../../src/context");
var GraphSnapshot_1 = require("../../../../../src/GraphSnapshot");
var EntitySnapshot_1 = require("../../../../../src/nodes/EntitySnapshot");
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
    describe("alias and non-alias, write non-alias first", function () {
        var snapshot;
        beforeAll(function () {
            var mixQuery = helpers_1.query("\n        query GetUser {\n          fullUserInfo: user {\n            id\n            FirstName: name\n            contact: phone\n          }\n          user {\n            id\n            name\n          }\n        }\n      ");
            snapshot = write_1.write(context, empty, mixQuery, {
                user: {
                    id: 0,
                    name: 'Foo',
                },
                fullUserInfo: {
                    id: 0,
                    FirstName: 'Foo',
                    contact: '555-555-5555',
                },
            }).snapshot;
        });
        it("only writes fields from the schema", function () {
            expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
                user: {
                    id: 0,
                    name: 'Foo',
                    phone: '555-555-5555',
                },
            });
        });
        it("checks shape of GraphNodeSnapshot", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId)).to.deep.eq(new EntitySnapshot_1.EntitySnapshot({
                user: {
                    id: 0,
                    name: 'Foo',
                    phone: '555-555-5555',
                },
            }, 
            /* inbound */ undefined, 
            /* outbound */ [{ id: '0', path: ['user'] }]));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXNBbmROb25BbGlhc1dyaXRlTm9uQWxpYXNGaXJzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFsaWFzQW5kTm9uQWxpYXNXcml0ZU5vbkFsaWFzRmlyc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzREFBMEQ7QUFDMUQsa0VBQWlFO0FBQ2pFLDBFQUF5RTtBQUN6RSw2REFBNEQ7QUFDNUQsb0RBQXlEO0FBQ3pELCtDQUEwRDtBQUVsRCxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSxnRkFBZ0Y7QUFDaEYsUUFBUSxDQUFDLGtCQUFrQixFQUFFO0lBRTNCLElBQU0sT0FBTyxHQUFHLElBQUksc0JBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUM7SUFDL0MsSUFBTSxLQUFLLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUM7SUFFbEMsUUFBUSxDQUFDLDRDQUE0QyxFQUFFO1FBRXJELElBQUksUUFBdUIsQ0FBQztRQUM1QixTQUFTLENBQUM7WUFDUixJQUFNLFFBQVEsR0FBRyxlQUFLLENBQUMscU9BWXRCLENBQUMsQ0FBQztZQUNILFFBQVEsR0FBRyxhQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUU7Z0JBQ3pDLElBQUksRUFBRTtvQkFDSixFQUFFLEVBQUUsQ0FBQztvQkFDTCxJQUFJLEVBQUUsS0FBSztpQkFDWjtnQkFDRCxZQUFZLEVBQUU7b0JBQ1osRUFBRSxFQUFFLENBQUM7b0JBQ0wsU0FBUyxFQUFFLEtBQUs7b0JBQ2hCLE9BQU8sRUFBRSxjQUFjO2lCQUN4QjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtZQUN2QyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxJQUFJLEVBQUU7b0JBQ0osRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLEtBQUs7b0JBQ1gsS0FBSyxFQUFFLGNBQWM7aUJBQ3RCO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsbUNBQW1DLEVBQUU7WUFDdEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDdEQsSUFBSSwrQkFBYyxDQUNoQjtnQkFDRSxJQUFJLEVBQUU7b0JBQ0osRUFBRSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLEtBQUs7b0JBQ1gsS0FBSyxFQUFFLGNBQWM7aUJBQ3RCO2FBQ0Y7WUFDRCxhQUFhLENBQUMsU0FBUztZQUN2QixjQUFjLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUM3QyxDQUNGLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==