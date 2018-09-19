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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUE4RDtBQVk5RCx5Q0FBdUM7QUFFdkMscURBSzBCO0FBSnhCLCtDQUFBLDJCQUEyQixDQUFxQjtBQUNoRCxrREFBQSxvQkFBb0IsQ0FBQTtBQUNwQiwyQ0FBQSxhQUFhLENBQUE7QUFnQmY7O0dBRUc7QUFDSCxxQ0FBNEMsU0FBa0M7SUFDNUUsSUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7O1lBQ2xDLEdBQUcsQ0FBQyxDQUFxQixJQUFBLEtBQUEsaUJBQUEsU0FBUyxDQUFDLG1CQUFtQixDQUFBLGdCQUFBO2dCQUFqRCxJQUFNLFVBQVUsV0FBQTtnQkFDbkIsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssYUFBYSxDQUFDO29CQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVk7Z0JBRTFELElBQUEsc0NBQVksQ0FBZ0I7Z0JBQ3BDLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxvQkFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQ0FBYSxDQUFDLFlBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2FBQ3JIOzs7Ozs7Ozs7SUFDSCxDQUFDO0lBRUQsTUFBTSxDQUFDLFFBQVEsQ0FBQzs7QUFDbEIsQ0FBQztBQVpELGtFQVlDO0FBQ0Q7O0dBRUc7QUFDSCxnQ0FBdUMsUUFBc0I7SUFDM0QsSUFBTSxHQUFHLEdBQWdCLEVBQUUsQ0FBQzs7UUFDNUIsR0FBRyxDQUFDLENBQXFCLElBQUEsS0FBQSxpQkFBQSxRQUFRLENBQUMsV0FBVyxDQUFBLGdCQUFBO1lBQXhDLElBQU0sVUFBVSxXQUFBO1lBQ25CLEVBQUUsQ0FBQyxDQUFD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