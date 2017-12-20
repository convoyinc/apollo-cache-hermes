"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var apollo_utilities_1 = require("apollo-utilities");
var primitive_1 = require("./primitive");
var apollo_utilities_2 = require("apollo-utilities");
exports.getOperationOrDie = apollo_utilities_2.getOperationDefinitionOrDie;
exports.variablesInOperation = apollo_utilities_2.variablesInOperation;
exports.valueFromNode = apollo_utilities_2.valueFromNode;
/**
 * Returns the default values of all variables in the operation.
 */
function variableDefaultsInOperation(operation) {
    var defaults = {};
    if (operation.variableDefinitions) {
        try {
            for (var _a = tslib_1.__values(operation.variableDefinitions), _b = _a.next(); !_b.done; _b = _a.next()) {
                var definition = _b.value;
                if (definition.type.kind === 'NonNullType')
                    continue; // Required.
                var defaultValue = definition.defaultValue;
                defaults[definition.variable.name.value] = primitive_1.isObject(defaultValue) ? apollo_utilities_1.valueFromNode(defaultValue) : null;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    return defaults;
    var e_1, _c;
}
exports.variableDefaultsInOperation = variableDefaultsInOperation;
/**
 * Extracts fragments from `document` by name.
 */
function fragmentMapForDocument(document) {
    var map = {};
    try {
        for (var _a = tslib_1.__values(document.definitions), _b = _a.next(); !_b.done; _b = _a.next()) {
            var definition = _b.value;
            if (definition.kind !== 'FragmentDefinition')
                continue;
            map[definition.name.value] = definition;
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return map;
    var e_2, _c;
}
exports.fragmentMapForDocument = fragmentMapForDocument;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUE4RDtBQVM5RCx5Q0FBdUM7QUFFdkMscURBSzBCO0FBSnhCLCtDQUFBLDJCQUEyQixDQUFxQjtBQUNoRCxrREFBQSxvQkFBb0IsQ0FBQTtBQUNwQiwyQ0FBQSxhQUFhLENBQUE7QUFJZjs7R0FFRztBQUNILHFDQUE0QyxTQUFrQztJQUM1RSxJQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDcEIsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQzs7WUFDbEMsR0FBRyxDQUFDLENBQXFCLElBQUEsS0FBQSxpQkFBQSxTQUFTLENBQUMsbUJBQW1CLENBQUEsZ0JBQUE7Z0JBQWpELElBQU0sVUFBVSxXQUFBO2dCQUNuQixFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxhQUFhLENBQUM7b0JBQUMsUUFBUSxDQUFDLENBQUMsWUFBWTtnQkFFMUQsSUFBQSxzQ0FBWSxDQUFnQjtnQkFDcEMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLG9CQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLGdDQUFhLENBQUMsWUFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7YUFDckg7Ozs7Ozs7OztJQUNILENBQUM7SUFFRCxNQUFNLENBQUMsUUFBUSxDQUFDOztBQUNsQixDQUFDO0FBWkQsa0VBWUM7QUFDRDs7R0FFRztBQUNILGdDQUF1QyxRQUFzQjtJQUMzRCxJQUFNLEdBQUcsR0FBZ0IsRUFBRSxDQUFDOztRQUM1QixHQUFHLENBQUMsQ0FBcUIsSUFBQSxLQUFBLGlCQUFBLFFBQVEsQ0FBQyxXQUFXLENBQUEsZ0JBQUE7WUFBeEMsSUFBTSxVQUFVLFdBQUE7WUFDbkIsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxvQkFBb0IsQ0FBQztnQkFBQyxRQUFRLENBQUM7WUFDdkQsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsVUFBVSxDQUFDO1NBQ3pDOzs7Ozs7Ozs7SUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDOztBQUNiLENBQUM7QUFSRCx3REFRQyJ9