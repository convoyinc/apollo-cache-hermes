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
    var silentContext = new context_1.CacheContext(helpers_1.silentConfig);
    var empty = new GraphSnapshot_1.GraphSnapshot();
    var valuesQuery = helpers_1.query("{ foo bar }");
    var entityQuery = helpers_1.query("{\n    foo {\n      id\n      name\n    }\n    bar {\n      id\n      name\n    }\n  }");
    describe("updates references in an array", function () {
        var arrayQuery, snapshot;
        beforeAll(function () {
            arrayQuery = helpers_1.query("{\n        things { id name }\n      }");
            snapshot = write_1.write(context, empty, arrayQuery, {
                things: [
                    { id: 1, name: 'One' },
                    { id: 2, name: 'Two' },
                    { id: 3, name: 'Three' },
                    { id: 4, name: 'Four' },
                    { id: 5, name: 'Five' },
                ],
            }).snapshot;
        });
        it("sets up outbound references", function () {
            expect(snapshot.getNodeSnapshot(QueryRootId).outbound).to.have.deep.members([
                { id: '1', path: ['things', 0] },
                { id: '2', path: ['things', 1] },
                { id: '3', path: ['things', 2] },
                { id: '4', path: ['things', 3] },
                { id: '5', path: ['things', 4] },
            ]);
        });
        it("lets you reorder references", function () {
            var updated = write_1.write(context, snapshot, arrayQuery, {
                things: [
                    { id: 5, name: 'Five' },
                    { id: 2, name: 'Two' },
                    { id: 1, name: 'One' },
                    { id: 4, name: 'Four' },
                    { id: 3, name: 'Three' },
                ],
            }).snapshot;
            expect(updated.getNodeSnapshot(QueryRootId).outbound).to.have.deep.members([
                { id: '5', path: ['things', 0] },
                { id: '2', path: ['things', 1] },
                { id: '1', path: ['things', 2] },
                { id: '4', path: ['things', 3] },
                { id: '3', path: ['things', 4] },
            ]);
        });
        it("drops references when the array shrinks", function () {
            var updated = write_1.write(context, snapshot, arrayQuery, {
                things: [
                    { id: 1, name: 'One' },
                    { id: 2, name: 'Two' },
                ],
            }).snapshot;
            expect(updated.getNodeSnapshot(QueryRootId).outbound).to.have.deep.members([
                { id: '1', path: ['things', 0] },
                { id: '2', path: ['things', 1] },
            ]);
        });
        it("supports multiple references to the same node", function () {
            var updated = write_1.write(context, snapshot, arrayQuery, {
                things: [
                    { id: 1, name: 'One' },
                    { id: 2, name: 'Two' },
                    { id: 3, name: 'Three' },
                    { id: 4, name: 'Four' },
                    { id: 5, name: 'Five' },
                    { id: 1, name: 'One' },
                    { id: 2, name: 'Two' },
                    { id: 3, name: 'Three' },
                    { id: 4, name: 'Four' },
                    { id: 5, name: 'Five' },
                ],
            }).snapshot;
            expect(updated.getNodeSnapshot(QueryRootId).outbound).to.have.deep.members([
                { id: '1', path: ['things', 0] },
                { id: '2', path: ['things', 1] },
                { id: '3', path: ['things', 2] },
                { id: '4', path: ['things', 3] },
                { id: '5', path: ['things', 4] },
                { id: '1', path: ['things', 5] },
                { id: '2', path: ['things', 6] },
                { id: '3', path: ['things', 7] },
                { id: '4', path: ['things', 8] },
                { id: '5', path: ['things', 9] },
            ]);
        });
        it("supports holes", function () {
            var updated = write_1.write(context, snapshot, arrayQuery, {
                things: [
                    null,
                    null,
                    { id: 3, name: 'Three' },
                    { id: 4, name: 'Four' },
                    null,
                ],
            }).snapshot;
            expect(updated.getNodeSnapshot(QueryRootId).outbound).to.have.deep.members([
                { id: '3', path: ['things', 2] },
                { id: '4', path: ['things', 3] },
            ]);
            expect(updated.getNodeData(QueryRootId)).to.deep.eq({
                things: [
                    null,
                    null,
                    { id: 3, name: 'Three' },
                    { id: 4, name: 'Four' },
                    null,
                ],
            });
        });
        it("treats blanks in sparse arrays as null", function () {
            var updated = write_1.write(silentContext, snapshot, arrayQuery, {
                things: [
                    undefined,
                    undefined,
                    { id: 3, name: 'Three' },
                    { id: 4, name: 'Four' },
                    undefined,
                ],
            }).snapshot;
            expect(updated.getNodeSnapshot(QueryRootId).outbound).to.have.deep.members([
                { id: '3', path: ['things', 2] },
                { id: '4', path: ['things', 3] },
            ]);
            expect(updated.getNodeData(QueryRootId)).to.deep.eq({
                things: [
                    null,
                    null,
                    { id: 3, name: 'Three' },
                    { id: 4, name: 'Four' },
                    null,
                ],
            });
        });
        it("allows arrays to shrink", function () {
            var updated = write_1.write(context, snapshot, arrayQuery, {
                things: [
                    { id: 1, name: 'One' },
                    { id: 2, name: 'Two' },
                    { id: 3, name: 'Three' },
                ],
            }).snapshot;
            expect(updated.getNodeData(QueryRootId)).to.deep.eq({
                things: [
                    { id: 1, name: 'One' },
                    { id: 2, name: 'Two' },
                    { id: 3, name: 'Three' },
                ],
            });
        });
        it("doesn't consider falsy values as blanks", function () {
            var baseSnapshot = write_1.write(context, empty, valuesQuery, {
                foo: [1, 2, 3, 4, 5],
                bar: 1,
            }).snapshot;
            var updated = write_1.write(context, baseSnapshot, valuesQuery, {
                foo: [
                    false,
                    0,
                    '',
                ],
                bar: 0,
            }).snapshot;
            expect(updated.getNodeData(QueryRootId)).to.deep.eq({
                foo: [
                    false,
                    0,
                    '',
                ],
                bar: 0,
            });
        });
        it("throws if we attempt to write non-objects with a selection set", function () {
            expect(function () {
                write_1.write(context, empty, entityQuery, { foo: [1, 2, 3, 4, 5] });
            }).to.throw(/foo\.\d/);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlUmVmZXJlbmNlc0luQW5BcnJheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVwZGF0ZVJlZmVyZW5jZXNJbkFuQXJyYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzREFBMEQ7QUFDMUQsa0VBQWlFO0FBQ2pFLDZEQUE0RDtBQUU1RCxvREFBdUU7QUFDdkUsK0NBQXdFO0FBRWhFLElBQUEsNkNBQXNCLENBQWtCO0FBRWhELGdGQUFnRjtBQUNoRixFQUFFO0FBQ0YsNkVBQTZFO0FBQzdFLGdGQUFnRjtBQUNoRixRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFFM0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBWSxDQUFDLHNCQUFZLENBQUMsQ0FBQztJQUMvQyxJQUFNLGFBQWEsR0FBRyxJQUFJLHNCQUFZLENBQUMsc0JBQVksQ0FBQyxDQUFDO0lBQ3JELElBQU0sS0FBSyxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO0lBQ2xDLElBQU0sV0FBVyxHQUFHLGVBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN6QyxJQUFNLFdBQVcsR0FBRyxlQUFLLENBQUMsd0ZBU3hCLENBQUMsQ0FBQztJQUVKLFFBQVEsQ0FBQyxnQ0FBZ0MsRUFBRTtRQUN6QyxJQUFJLFVBQXdCLEVBQUUsUUFBdUIsQ0FBQztRQUN0RCxTQUFTLENBQUM7WUFDUixVQUFVLEdBQUcsZUFBSyxDQUFDLHdDQUVqQixDQUFDLENBQUM7WUFFSixRQUFRLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFO2dCQUMzQyxNQUFNLEVBQUU7b0JBQ04sRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7b0JBQ3RCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO29CQUN0QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTtvQkFDeEIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7b0JBQ3ZCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO2lCQUN4QjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2QkFBNkIsRUFBRTtZQUNoQyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQzNFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7YUFDakMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkJBQTZCLEVBQUU7WUFDaEMsSUFBTSxPQUFPLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFO2dCQUNuRCxNQUFNLEVBQUU7b0JBQ04sRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7b0JBQ3ZCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO29CQUN0QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtvQkFDdEIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7b0JBQ3ZCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO2lCQUN6QjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFFWixNQUFNLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQzFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7YUFDakMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMseUNBQXlDLEVBQUU7WUFDNUMsSUFBTSxPQUFPLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFO2dCQUNuRCxNQUFNLEVBQUU7b0JBQ04sRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7b0JBQ3RCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO2lCQUN2QjthQUNGLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFFWixNQUFNLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQzFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7YUFDakMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsK0NBQStDLEVBQUU7WUFDbEQsSUFBTSxPQUFPLEdBQUcsYUFBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFO2dCQUNuRCxNQUFNLEVBQUU7b0JBQ04sRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7b0JBQ3RCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO29CQUN0QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTtvQkFDeEIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7b0JBQ3ZCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO29CQUN2QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtvQkFDdEIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7b0JBQ3RCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO29CQUN4QixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtvQkFDdkIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7aUJBQ3hCO2FBQ0YsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUVaLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDMUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDaEMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDaEMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDaEMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDaEMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDaEMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDaEMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDaEMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDaEMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDaEMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTthQUNqQyxDQUFDLENBQUM7UUFDTCxDQUFD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