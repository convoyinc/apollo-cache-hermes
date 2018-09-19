"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../../../../src");
var helpers_1 = require("../../../helpers");
describe("context.CacheContext", function () {
    describe("onChange callback on error", function () {
        var mockOnChange = jest.fn();
        var graphqlQuery = helpers_1.query("{\n      foo {\n        id\n        bar {\n          id\n          name\n        }\n      }\n    }");
        var cache = new src_1.Cache({
            logger: {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                group: jest.fn(),
                groupEnd: jest.fn(),
            },
            onChange: mockOnChange,
        });
        it("do not trigger onChange callback on error", function () {
            cache.transaction(function (transaction) {
                transaction.write(graphqlQuery, {
                    foo: {
                        id: 0,
                        bar: {
                            id: 1,
                            name: 'Gouda',
                        },
                    },
                });
                throw new Error("Fake error");
            });
            expect(mockOnChange.mock.calls.length).to.equal(0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25DaGFuZ2VXaXRoRXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvbkNoYW5nZVdpdGhFcnJvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUF3QztBQUN4Qyw0Q0FBeUM7QUFFekMsUUFBUSxDQUFDLHNCQUFzQixFQUFFO0lBQy9CLFFBQVEsQ0FBQyw0QkFBNEIsRUFBRTtRQUNyQyxJQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDL0IsSUFBTSxZQUFZLEdBQUcsZUFBSyxDQUFDLG9HQVF6QixDQUFDLENBQUM7UUFFSixJQUFNLEtBQUssR0FBRyxJQUFJLFdBQUssQ0FBQztZQUN0QixNQUFNLEVBQUU7Z0JBQ04sS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7Z0JBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO2dCQUNmLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO2dCQUNmLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO2dCQUNoQixRQUFRLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTthQUNwQjtZQUNELFFBQVEsRUFBRSxZQUFZO1NBQ3ZCLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywyQ0FBMkMsRUFBRTtZQUM5QyxLQUFLLENBQUMsV0FBVyxDQUFDLFVBQUMsV0FBVztnQkFDNUIsV0FBVyxDQUFDLEtBQUssQ0FDZixZQUFZLEVBQ1o7b0JBQ0UsR0FBRyxFQUFFO3dCQUNILEVBQUUsRUFBRSxDQUFDO3dCQUNMLEdBQUcsRUFBRTs0QkFDSCxFQUFFLEVBQUUsQ0FBQzs0QkFDTCxJQUFJLEVBQUUsT0FBTzt5QkFDZDtxQkFDRjtpQkFDRixDQUNGLENBQUM7Z0JBQ0YsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoQyxDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JELENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9