"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var CacheContext_1 = require("../../src/context/CacheContext");
var GraphSnapshot_1 = require("../../src/GraphSnapshot");
var write_1 = require("../../src/operations/write");
var context_1 = require("./context");
var graphql_1 = require("./graphql");
function createSnapshot(payload, gqlString, gqlVariables, rootId, cacheContext) {
    if (cacheContext === void 0) { cacheContext = new CacheContext_1.CacheContext(context_1.strictConfig); }
    var rawOperation = graphql_1.query(gqlString, gqlVariables, rootId);
    return write_1.write(cacheContext, new GraphSnapshot_1.GraphSnapshot(), tslib_1.__assign({}, rawOperation, { document: cacheContext.transformDocument(rawOperation.document) }), payload);
}
exports.createSnapshot = createSnapshot;
function updateSnapshot(baseline, payload, gqlString, gqlVariables, rootId, cacheContext) {
    if (cacheContext === void 0) { cacheContext = new CacheContext_1.CacheContext(context_1.strictConfig); }
    var rawOperation = graphql_1.query(gqlString, gqlVariables, rootId);
    return write_1.write(cacheContext, baseline, tslib_1.__assign({}, rawOperation, { document: cacheContext.transformDocument(rawOperation.document) }), payload);
}
exports.updateSnapshot = updateSnapshot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ3cml0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrREFBOEQ7QUFDOUQseURBQXdEO0FBRXhELG9EQUFtRDtBQUluRCxxQ0FBeUM7QUFDekMscUNBQWtDO0FBRWxDLHdCQUNFLE9BQW1CLEVBQ25CLFNBQWlCLEVBQ2pCLFlBQXlCLEVBQ3pCLE1BQWUsRUFDZixZQUEyRDtJQUEzRCw2QkFBQSxFQUFBLG1CQUFpQywyQkFBWSxDQUFDLHNCQUFZLENBQUM7SUFHM0QsSUFBTSxZQUFZLEdBQUcsZUFBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFNUQsTUFBTSxDQUFDLGFBQUssQ0FDVixZQUFZLEVBQ1osSUFBSSw2QkFBYSxFQUFFLHVCQUNkLFlBQVksSUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FDbEYsT0FBTyxDQUNSLENBQUM7QUFDSixDQUFDO0FBaEJELHdDQWdCQztBQUVELHdCQUNFLFFBQXVCLEVBQ3ZCLE9BQW1CLEVBQ25CLFNBQWlCLEVBQ2pCLFlBQXlCLEVBQ3pCLE1BQWUsRUFDZixZQUEyRDtJQUEzRCw2QkFBQSxFQUFBLG1CQUFpQywyQkFBWSxDQUFDLHNCQUFZLENBQUM7SUFHM0QsSUFBTSxZQUFZLEdBQUcsZUFBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFNUQsTUFBTSxDQUFDLGFBQUssQ0FDVixZQUFZLEVBQ1osUUFBUSx1QkFDSCxZQUFZLElBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQ2xGLE9BQU8sQ0FDUixDQUFDO0FBQ0osQ0FBQztBQWpCRCx3Q0FpQkMifQ==