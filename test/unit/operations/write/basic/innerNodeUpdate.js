"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("../../../../helpers");
// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe("operations.write", function () {
    describe("inner nodes update", function () {
        var snapshot, editedNodeIds;
        beforeAll(function () {
            var baseline = helpers_1.createSnapshot({
                foo: { id: 1, name: 'Foo' },
                bar: { id: 2, name: 'Bar' },
            }, "{\n          foo {\n            id\n            name\n          }\n          bar {\n            id\n            name\n          }\n        }").snapshot;
            var result = helpers_1.updateSnapshot(baseline, {
                id: 1,
                name: 'moo',
                extra: true,
            }, "{ id name extra }", 
            /* gqlVariables */ undefined, 
            /* rootId */ '1');
            snapshot = result.snapshot;
            editedNodeIds = result.editedNodeIds;
        });
        it("edits the inner node", function () {
            expect(snapshot.getNodeData('1')).to.deep.eq({ id: 1, name: 'moo', extra: true });
        });
        it("marks only the inner node as edited", function () {
            expect(Array.from(editedNodeIds)).to.have.members(['1']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5uZXJOb2RlVXBkYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW5uZXJOb2RlVXBkYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsK0NBQXFFO0FBRXJFLGdGQUFnRjtBQUNoRixFQUFFO0FBQ0YsNkVBQTZFO0FBQzdFLGdGQUFnRjtBQUNoRixRQUFRLENBQUMsa0JBQWtCLEVBQUU7SUFDM0IsUUFBUSxDQUFDLG9CQUFvQixFQUFFO1FBRTdCLElBQUksUUFBdUIsRUFBRSxhQUEwQixDQUFDO1FBQ3hELFNBQVMsQ0FBQztZQUNSLElBQU0sUUFBUSxHQUFHLHdCQUFjLENBQzdCO2dCQUNFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtnQkFDM0IsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO2FBQzVCLEVBQ0QsOElBU0UsQ0FDSCxDQUFDLFFBQVEsQ0FBQztZQUVYLElBQU0sTUFBTSxHQUFHLHdCQUFjLENBQUMsUUFBUSxFQUNwQztnQkFDRSxFQUFFLEVBQUUsQ0FBQztnQkFDTCxJQUFJLEVBQUUsS0FBSztnQkFDWCxLQUFLLEVBQUUsSUFBSTthQUNaLEVBQ0QsbUJBQW1CO1lBQ25CLGtCQUFrQixDQUFDLFNBQVM7WUFDNUIsWUFBWSxDQUFDLEdBQUcsQ0FDakIsQ0FBQztZQUNGLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1lBQzNCLGFBQWEsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHNCQUFzQixFQUFFO1lBQ3pCLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDcEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMscUNBQXFDLEVBQUU7WUFDeEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDIn0=