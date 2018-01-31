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
/**
 * Returns whether a selection set is considered static from the cache's
 * perspective.
 *
 * This is helpful if you want to assert that certain fragments or queries stay
 * static within the cache (and thus, avoid read-time overhead).
 *
 * If the selectionSet contains fragments, you must provide a getter function
 * that exposes them.
 */
function selectionSetIsStatic(selectionSet, fragmentGetter) {
    try {
        for (var _a = tslib_1.__values(selectionSet.selections), _b = _a.next(); !_b.done; _b = _a.next()) {
            var selection = _b.value;
            if (selection.kind === 'Field') {
                if (!fieldIsStatic(selection))
                    return false;
                if (selection.selectionSet && !selectionSetIsStatic(selection.selectionSet, fragmentGetter))
                    return false;
            }
            else if (selection.kind === 'FragmentSpread') {
                if (!fragmentGetter) {
                    throw new Error("fragmentGetter is required for selection sets with ...fragments");
                }
                var fragmentSet = fragmentGetter(selection.name.value);
                if (!fragmentSet) {
                    throw new Error("Unknown fragment " + selection.name.value + " in isSelectionSetStatic");
                }
                if (!selectionSetIsStatic(fragmentSet, fragmentGetter))
                    return false;
            }
            else if (selection.kind === 'InlineFragment') {
                if (!selectionSetIsStatic(selection.selectionSet, fragmentGetter))
                    return false;
            }
            else {
                throw new Error("Unknown selection type " + selection.kind + " in isSelectionSetStatic");
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return true;
    var e_3, _c;
}
exports.selectionSetIsStatic = selectionSetIsStatic;
function fieldIsStatic(field) {
    var isActuallyStatic = !fieldHasAlias(field) && !fieldIsParameterized(field);
    return isActuallyStatic || fieldHasStaticDirective(field);
}
exports.fieldIsStatic = fieldIsStatic;
function fieldHasAlias(field) {
    return !!field.alias;
}
exports.fieldHasAlias = fieldHasAlias;
function fieldIsParameterized(field) {
    return !!(field.arguments && field.arguments.length);
}
exports.fieldIsParameterized = fieldIsParameterized;
function fieldHasStaticDirective(_a) {
    var directives = _a.directives;
    if (!directives)
        return false;
    return directives.some(function (directive) { return directive.name.value === 'static'; });
}
exports.fieldHasStaticDirective = fieldHasStaticDirective;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUE4RDtBQVc5RCx5Q0FBdUM7QUFFdkMscURBSzBCO0FBSnhCLCtDQUFBLDJCQUEyQixDQUFxQjtBQUNoRCxrREFBQSxvQkFBb0IsQ0FBQTtBQUNwQiwyQ0FBQSxhQUFhLENBQUE7QUFJZjs7R0FFRztBQUNILHFDQUE0QyxTQUFrQztJQUM1RSxJQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDcEIsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQzs7WUFDbEMsR0FBRyxDQUFDLENBQXFCLElBQUEsS0FBQSxpQkFBQSxTQUFTLENBQUMsbUJBQW1CLENBQUEsZ0JBQUE7Z0JBQWpELElBQU0sVUFBVSxXQUFBO2dCQUNuQixFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxhQUFhLENBQUM7b0JBQUMsUUFBUSxDQUFDLENBQUMsWUFBWTtnQkFFMUQsSUFBQSxzQ0FBWSxDQUFnQjtnQkFDcEMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLG9CQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLGdDQUFhLENBQUMsWUFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7YUFDckg7Ozs7Ozs7OztJQUNILENBQUM7SUFFRCxNQUFNLENBQUMsUUFBUSxDQUFDOztBQUNsQixDQUFDO0FBWkQsa0VBWUM7QUFDRDs7R0FFRztBQUNILGdDQUF1QyxRQUFzQjtJQUMzRCxJQUFNLEdBQUcsR0FBZ0IsRUFBRSxDQUFDOztRQUM1QixHQUFHLENBQUMsQ0FBcUIsSUFBQSxLQUFBLGlCQUFBLFFBQVEsQ0FBQyxXQUFXLENBQUEsZ0JBQUE7WUFBeEMsSUFBTSxVQUFVLFdBQUE7WUFDbkIsRUFBRSxDQUFDLENBQUMs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