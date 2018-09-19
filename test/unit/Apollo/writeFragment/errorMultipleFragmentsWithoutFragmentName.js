"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var Hermes_1 = require("../../../../src/apollo/Hermes");
var CacheContext_1 = require("../../../../src/context/CacheContext");
var context_1 = require("../../../helpers/context");
describe("writeFragment when using multiple fragments without fragmentName", function () {
    var hermes;
    beforeAll(function () {
        hermes = new Hermes_1.Hermes(new CacheContext_1.CacheContext(context_1.strictConfig));
    });
    it("throws an error", function () {
        expect(function () {
            hermes.writeFragment({
                id: '123',
                fragment: graphql_tag_1.default("\n          fragment viewer on Viewer {\n            id\n            name\n          }\n\n          fragment shipment on Shipment {\n            id\n            name\n            startLoc\n            stopLoc\n          }\n        "),
                data: {
                    id: 123,
                    name: 'Gouda',
                    __typename: 'Viewer',
                },
            });
        }).to.throw(/Found 2 fragments. `fragmentName` must be provided/i);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JNdWx0aXBsZUZyYWdtZW50c1dpdGhvdXRGcmFnbWVudE5hbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlcnJvck11bHRpcGxlRnJhZ21lbnRzV2l0aG91dEZyYWdtZW50TmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE4QjtBQUU5Qix3REFBdUQ7QUFDdkQscUVBQW9FO0FBQ3BFLG9EQUF3RDtBQUV4RCxRQUFRLENBQUMsa0VBQWtFLEVBQUU7SUFFM0UsSUFBSSxNQUFjLENBQUM7SUFDbkIsU0FBUyxDQUFDO1FBQ1IsTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksMkJBQVksQ0FBQyxzQkFBWSxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxpQkFBaUIsRUFBRTtRQUNwQixNQUFNLENBQUM7WUFDTCxNQUFNLENBQUMsYUFBYSxDQUFDO2dCQUNuQixFQUFFLEVBQUUsS0FBSztnQkFDVCxRQUFRLEVBQUUscUJBQUcsQ0FBQyx5T0FZYixDQUFDO2dCQUNGLElBQUksRUFBRTtvQkFDSixFQUFFLEVBQUUsR0FBRztvQkFDUCxJQUFJLEVBQUUsT0FBTztvQkFDYixVQUFVLEVBQUUsUUFBUTtpQkFDckI7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLHFEQUFxRCxDQUFDLENBQUM7SUFDckUsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUMsQ0FBQyJ9