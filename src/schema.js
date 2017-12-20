"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var util_1 = require("./util");
/**
 * There are a few pre-defined nodes present in all schemas.
 */
var StaticNodeId;
(function (StaticNodeId) {
    StaticNodeId["QueryRoot"] = "ROOT_QUERY";
    StaticNodeId["MutationRoot"] = "ROOT_MUTATION";
    StaticNodeId["SubscriptionRoot"] = "ROOT_SUBSCRIPTION";
})(StaticNodeId = exports.StaticNodeId || (exports.StaticNodeId = {}));
function isSerializable(value, allowUndefined) {
    if (util_1.isScalar(value)) {
        // NaN is considered to typeof number
        var isNaNValue = Number.isNaN(value);
        return allowUndefined ? !isNaNValue : !isNaNValue && value !== undefined;
    }
    if (util_1.isObject(value)) {
        try {
            for (var _a = tslib_1.__values(Object.getOwnPropertyNames(value)), _b = _a.next(); !_b.done; _b = _a.next()) {
                var propName = _b.value;
                if (!isSerializable(value[propName], allowUndefined)) {
                    return false;
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
        return true;
    }
    if (Array.isArray(value)) {
        try {
            for (var value_1 = tslib_1.__values(value), value_1_1 = value_1.next(); !value_1_1.done; value_1_1 = value_1.next()) {
                var element = value_1_1.value;
                if (!isSerializable(element, allowUndefined)) {
                    return false;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (value_1_1 && !value_1_1.done && (_d = value_1.return)) _d.call(value_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return true;
    }
    return false;
    var e_1, _c, e_2, _d;
}
exports.isSerializable = isSerializable;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NoZW1hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQU1BLCtCQUE0QztBQW1CNUM7O0dBRUc7QUFDSCxJQUFZLFlBSVg7QUFKRCxXQUFZLFlBQVk7SUFDdEIsd0NBQXdCLENBQUE7SUFDeEIsOENBQThCLENBQUE7SUFDOUIsc0RBQXNDLENBQUE7QUFDeEMsQ0FBQyxFQUpXLFlBQVksR0FBWixvQkFBWSxLQUFaLG9CQUFZLFFBSXZCO0FBOEVELHdCQUErQixLQUFVLEVBQUUsY0FBd0I7SUFDakUsRUFBRSxDQUFDLENBQUMsZUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQixxQ0FBcUM7UUFDckMsSUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFZLENBQUMsQ0FBQztRQUM5QyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLElBQUksS0FBSyxLQUFLLFNBQVMsQ0FBQztJQUMzRSxDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsZUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs7WUFDcEIsR0FBRyxDQUFDLENBQW1CLElBQUEsS0FBQSxpQkFBQSxNQUFNLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUEsZ0JBQUE7Z0JBQW5ELElBQU0sUUFBUSxXQUFBO2dCQUNqQixFQUFFLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyRCxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUNmLENBQUM7YUFDRjs7Ozs7Ozs7O1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs7WUFDekIsR0FBRyxDQUFDLENBQWtCLElBQUEsVUFBQSxpQkFBQSxLQUFLLENBQUEsNEJBQUE7Z0JBQXRCLElBQU0sT0FBTyxrQkFBQTtnQkFDaEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDN0MsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDZixDQUFDO2FBQ0Y7Ozs7Ozs7OztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQzs7QUFDZixDQUFDO0FBMUJELHdDQTBCQyJ9