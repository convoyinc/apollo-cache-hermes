"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ParsedQueryNode_1 = require("../ParsedQueryNode");
var util_1 = require("../util");
/**
 * Metadata about a GraphQL document (query/mutation/fragment/etc).
 *
 * We do a fair bit of pre-processing over them, and these objects hang onto
 * that information.
 */
var QueryInfo = /** @class */ (function () {
    function QueryInfo(context, raw) {
        this.document = raw.document;
        this.operation = util_1.getOperationOrDie(raw.document);
        this.operationType = this.operation.operation;
        this.operationName = this.operation.name && this.operation.name.value;
        this.operationSource = this.operation.loc && this.operation.loc.source.body;
        this.fragmentMap = util_1.fragmentMapForDocument(raw.document);
        var _a = ParsedQueryNode_1.parseQuery(context, this.fragmentMap, this.operation.selectionSet), parsedQuery = _a.parsedQuery, variables = _a.variables;
        this.parsed = parsedQuery;
        this.variables = variables;
        this.variableDefaults = util_1.variableDefaultsInOperation(this.operation);
        // Skip verification if rawOperation is constructed from fragments
        // (e.g readFragment/writeFragment) because fragment will not declare
        // variables. Users will have to know to provide `variables` parameter
        if (!raw.fromFragmentDocument) {
            this._assertValid();
        }
    }
    QueryInfo.prototype._assertValid = function () {
        var messages = [];
        var declaredVariables = util_1.variablesInOperation(this.operation);
        this._assertAllVariablesDeclared(messages, declaredVariables);
        this._assertAllVariablesUsed(messages, declaredVariables);
        if (!messages.length)
            return;
        var mainMessage = "Validation errors in " + this.operationType + " " + (this.operationName || '<unknown>');
        throw new Error(mainMessage + ":" + messages.map(function (m) { return "\n * " + m; }).join(''));
    };
    QueryInfo.prototype._assertAllVariablesDeclared = function (messages, declaredVariables) {
        try {
            for (var _a = tslib_1.__values(this.variables), _b = _a.next(); !_b.done; _b = _a.next()) {
                var name_1 = _b.value;
                if (!declaredVariables.has(name_1)) {
                    messages.push("Variable $" + name_1 + " is used, but not declared");
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var e_1, _c;
    };
    QueryInfo.prototype._assertAllVariablesUsed = function (messages, declaredVariables) {
        try {
            for (var declaredVariables_1 = tslib_1.__values(declaredVariables), declaredVariables_1_1 = declaredVariables_1.next(); !declaredVariables_1_1.done; declaredVariables_1_1 = declaredVariables_1.next()) {
                var name_2 = declaredVariables_1_1.value;
                if (!this.variables.has(name_2)) {
                    messages.push("Variable $" + name_2 + " is unused");
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (declaredVariables_1_1 && !declaredVariables_1_1.done && (_a = declaredVariables_1.return)) _a.call(declaredVariables_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var e_2, _a;
    };
    return QueryInfo;
}());
exports.QueryInfo = QueryInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVlcnlJbmZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUXVlcnlJbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHNEQUEwRTtBQUcxRSxnQ0FTaUI7QUFJakI7Ozs7O0dBS0c7QUFDSDtJQTRCRSxtQkFBWSxPQUFxQixFQUFFLEdBQWlCO1FBQ2xELElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQztRQUM3QixJQUFJLENBQUMsU0FBUyxHQUFHLHdCQUFpQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO1FBQzlDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3RFLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUM1RSxJQUFJLENBQUMsV0FBVyxHQUFHLDZCQUFzQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVsRCxJQUFBLHlGQUErRixFQUE3Riw0QkFBVyxFQUFFLHdCQUFTLENBQXdFO1FBQ3RHLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO1FBQzFCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxrQ0FBMkIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFcEUsa0VBQWtFO1FBQ2xFLHFFQUFxRTtRQUNyRSxzRUFBc0U7UUFDdEUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN0QixDQUFDO0lBQ0gsQ0FBQztJQUVPLGdDQUFZLEdBQXBCO1FBQ0UsSUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1FBRTlCLElBQU0saUJBQWlCLEdBQUcsMkJBQW9CLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9ELElBQUksQ0FBQywyQkFBMkIsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFFMUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQzdCLElBQU0sV0FBVyxHQUFHLDBCQUF3QixJQUFJLENBQUMsYUFBYSxVQUFJLElBQUksQ0FBQyxhQUFhLElBQUksV0FBVyxDQUFFLENBQUM7UUFDdEcsTUFBTSxJQUFJLEtBQUssQ0FBSSxXQUFXLFNBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLFVBQVEsQ0FBRyxFQUFYLENBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUcsQ0FBQyxDQUFDO0lBQy9FLENBQUM7SUFFTywrQ0FBMkIsR0FBbkMsVUFBb0MsUUFBa0IsRUFBRSxpQkFBOEI7O1lBQ3BGLEdBQUcsQ0FBQyxDQUFlLElBQUEsS0FBQSxpQkFBQSxJQUFJLENBQUMsU0FBUyxDQUFBLGdCQUFBO2dCQUE1QixJQUFNLE1BQUksV0FBQTtnQkFDYixFQUFFLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2pDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZUFBYSxNQUFJLCtCQUE0QixDQUFDLENBQUM7Z0JBQy9ELENBQUM7YUFDRjs7Ozs7Ozs7OztJQUNILENBQUM7SUFFTywyQ0FBdUIsR0FBL0IsVUFBZ0MsUUFBa0IsRUFBRSxpQkFBOEI7O1lBQ2hGLEdBQUcsQ0FBQyxDQUFlLElBQUEsc0JBQUEsaUJBQUEsaUJBQWlCLENBQUEsb0RBQUE7Z0JBQS9CLElBQU0sTUFBSSw4QkFBQTtnQkFDYixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDOUIsUUFBUSxDQUFDLElBQUksQ0FBQyxlQUFhLE1BQUksZUFBWSxDQUFDLENBQUM7Z0JBQy9DLENBQUM7YUFDRjs7Ozs7Ozs7OztJQUNILENBQUM7SUFFSCxnQkFBQztBQUFELENBQUMsQUE3RUQsSUE2RUM7QUE3RVksOEJBQVMifQ==