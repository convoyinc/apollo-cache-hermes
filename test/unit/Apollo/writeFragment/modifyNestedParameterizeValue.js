"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var EntitySnapshot_1 = require("../../../../src/nodes/EntitySnapshot");
var ParameterizedValueSnapshot_1 = require("../../../../src/nodes/ParameterizedValueSnapshot");
var SnapshotEditor_1 = require("../../../../src/operations/SnapshotEditor");
var schema_1 = require("../../../../src/schema");
var context_1 = require("../../../helpers/context");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("writeFragment with nested paramterized value", function () {
    var hermes;
    beforeAll(function () {
        hermes = new Hermes_1.Hermes(new CacheContext_1.CacheContext(context_1.strictConfig));
        hermes.writeQuery({
            query: graphql_tag_1.default("\n        query getViewer {\n          viewer {\n            id\n            name\n            __typename\n            trucks(number: 2) {\n              name\n              year\n            }\n          }\n        }\n      "),
            data: {
                viewer: {
                    id: 123,
                    name: 'Gouda',
                    __typename: 'Viewer',
                    trucks: [
                        {
                            name: 'truck0',
                            year: '1998',
                        },
                    ],
                },
            },
        });
    });
    it("correctly add parameterized value", function () {
        hermes.writeFragment({
            id: '123',
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          trucks(number: 2) {\n            name\n            year\n            driverName\n          }\n        }\n      "),
            data: {
                id: 123,
                trucks: [
                    {
                        name: 'truck0',
                        year: '1998',
                        driverName: 'Bob',
                    },
                    {
                        name: 'truck1',
                        year: '1997',
                        driverName: 'Bob',
                    },
                ],
            },
        });
        var parameterizedTruckId = SnapshotEditor_1.nodeIdForParameterizedValue('123', ['trucks'], { number: 2 });
        expect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot('123')).to.deep.eq(new EntitySnapshot_1.EntitySnapshot({
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
        }, [{ id: QueryRootId, path: ['viewer'] }], [{ id: parameterizedTruckId, path: ['trucks'] }]));
        expect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot(parameterizedTruckId)).to.deep.eq(new ParameterizedValueSnapshot_1.ParameterizedValueSnapshot([
            {
                name: 'truck0',
                year: '1998',
                driverName: 'Bob',
            },
            {
                name: 'truck1',
                year: '1997',
                driverName: 'Bob',
            },
        ], [{ id: '123', path: ['trucks'] }]));
    });
    it("correctly overwrite parameterized value", function () {
        hermes.writeFragment({
            id: '123',
            fragment: graphql_tag_1.default("\n        fragment viewer on Viewer {\n          id\n          trucks(number: 2) {\n            name\n            year\n            driverName\n          }\n        }\n      "),
            data: {
                id: 123,
                trucks: [
                    {
                        name: 'truck0',
                        year: '1998',
                        driverName: 'Bob',
                    },
                ],
            },
        });
        var parameterizedTruckId = SnapshotEditor_1.nodeIdForParameterizedValue('123', ['trucks'], { number: 2 });
        expect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot('123')).to.deep.eq(new EntitySnapshot_1.EntitySnapshot({
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
        }, [{ id: QueryRootId, path: ['viewer'] }], [{ id: parameterizedTruckId, path: ['trucks'] }]));
        expect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot(parameterizedTruckId)).to.deep.eq(new ParameterizedValueSnapshot_1.ParameterizedValueSnapshot([
            {
                name: 'truck0',
                year: '1998',
                driverName: 'Bob',
            },
        ], [{ id: '123', path: ['trucks'] }]));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kaWZ5TmVzdGVkUGFyYW1ldGVyaXplVmFsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb2RpZnlOZXN0ZWRQYXJhbWV0ZXJpemVWYWx1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE4QjtBQUU5Qix3REFBdUQ7QUFDdkQscUVBQW9FO0FBQ3BFLHVFQUFzRTtBQUN0RSwrRkFBOEY7QUFDOUYsNEVBQXdGO0FBQ3hGLGlEQUFzRDtBQUN0RCxvREFBd0Q7QUFFaEQsSUFBQSw2Q0FBc0IsQ0FBa0I7QUFFaEQsUUFBUSxDQUFDLDhDQUE4QyxFQUFFO0lBRXZELElBQUksTUFBYyxDQUFDO0lBQ25CLFNBQVMsQ0FBQztRQUNSLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLDJCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUNoQixLQUFLLEVBQUUscUJBQUcsQ0FBQyxtT0FZVixDQUFDO1lBQ0YsSUFBSSxFQUFFO2dCQUNKLE1BQU0sRUFBRTtvQkFDTixFQUFFLEVBQUUsR0FBRztvQkFDUCxJQUFJLEVBQUUsT0FBTztvQkFDYixVQUFVLEVBQUUsUUFBUTtvQkFDcEIsTUFBTSxFQUFFO3dCQUNOOzRCQUNFLElBQUksRUFBRSxRQUFROzRCQUNkLElBQUksRUFBRSxNQUFNO3lCQUNiO3FCQUNGO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRTtRQUN0QyxNQUFNLENBQUMsYUFBYSxDQUFDO1lBQ25CLEVBQUUsRUFBRSxLQUFLO1lBQ1QsUUFBUSxFQUFFLHFCQUFHLENBQUMsZ0xBU2IsQ0FBQztZQUNGLElBQUksRUFBRTtnQkFDSixFQUFFLEVBQUUsR0FBRztnQkFDUCxNQUFNLEVBQUU7b0JBQ047d0JBQ0UsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsSUFBSSxFQUFFLE1BQU07d0JBQ1os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