"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ast_1 = require("./ast");
/**
 *
 */
var OperationWalkNode = /** @class */ (function () {
    function OperationWalkNode(selectionSet, parent) {
        this.selectionSet = selectionSet;
        this.parent = parent;
    }
    return OperationWalkNode;
}());
/**
 *
 */
function walkOperation(document, result, visitor) {
    var operation = ast_1.getOperationOrDie(document);
    var fragmentMap = ast_1.fragmentMapForDocument(document);
    // Perform the walk as a depth-first traversal; and unlike the payload walk,
    // we don't bother tracking the path.
    var stack = [new OperationWalkNode(operation.selectionSet, result)];
    while (stack.length) {
        var _a = stack.pop(), selectionSet = _a.selectionSet, parent_1 = _a.parent;
        // We consider null nodes to be skippable (and satisfy the walk).
        if (parent_1 === null)
            continue;
        // Fan-out for arrays.
        if (Array.isArray(parent_1)) {
            // Push in reverse purely for ergonomics: they'll be pulled off in order.
            for (var i = parent_1.length - 1; i >= 0; i--) {
                stack.push(new OperationWalkNode(selectionSet, parent_1[i]));
            }
            continue;
        }
        var fields = [];
        try {
            // TODO: Directives?
            for (var _b = tslib_1.__values(selectionSet.selections), _c = _b.next(); !_c.done; _c = _b.next()) {
                var selection = _c.value;
                // A simple field.
                if (selection.kind === 'Field') {
                    fields.push(selection);
                    if (selection.selectionSet) {
                        var nameNode = selection.alias || selection.name;
                        var child = get(parent_1, nameNode.value);
                        stack.push(new OperationWalkNode(selection.selectionSet, child));
                    }
                    // Fragments are applied to the current value.
                }
                else if (selection.kind === 'FragmentSpread') {
                    var fragment = fragmentMap[selection.name.value];
                    if (!fragment) {
                        throw new Error("Expected fragment " + selection.name.value + " to be defined");
                    }
                    stack.push(new OperationWalkNode(fragment.selectionSet, parent_1));
                }
                else if (selection.kind === 'InlineFragment') {
                    stack.push(new OperationWalkNode(selection.selectionSet, parent_1));
                }
                else {
                    throw new Error("Unsupported GraphQL AST Node " + selection.kind);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_d = _b.return)) _d.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (fields.length) {
            var shouldStop = visitor(parent_1, fields);
            if (shouldStop)
                return;
        }
    }
    var e_1, _d;
}
exports.walkOperation = walkOperation;
function get(value, key) {
    // Remember: arrays are typeof 'object', too.
    return value !== null && typeof value === 'object' ? value[key] : undefined;
}
exports.get = get;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBUUEsNkJBQWtFO0FBRWxFOztHQUVHO0FBQ0g7SUFDRSwyQkFDa0IsWUFBOEIsRUFDOUIsTUFBa0I7UUFEbEIsaUJBQVksR0FBWixZQUFZLENBQWtCO1FBQzlCLFdBQU0sR0FBTixNQUFNLENBQVk7SUFDakMsQ0FBQztJQUNOLHdCQUFDO0FBQUQsQ0FBQyxBQUxELElBS0M7QUFPRDs7R0FFRztBQUNILHVCQUE4QixRQUFzQixFQUFFLE1BQThCLEVBQUUsT0FBeUI7SUFDN0csSUFBTSxTQUFTLEdBQUcsdUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDOUMsSUFBTSxXQUFXLEdBQUcsNEJBQXNCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFckQsNEVBQTRFO0lBQzVFLHFDQUFxQztJQUNyQyxJQUFNLEtBQUssR0FBRyxDQUFDLElBQUksaUJBQWlCLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBRXRFLE9BQU8sS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2QsSUFBQSxnQkFBdUMsRUFBckMsOEJBQVksRUFBRSxvQkFBTSxDQUFrQjtRQUM5QyxpRUFBaUU7UUFDakUsRUFBRSxDQUFDLENBQUMsUUFBTSxLQUFLLElBQUksQ0FBQztZQUFDLFFBQVEsQ0FBQztRQUU5QixzQkFBc0I7UUFDdEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIseUVBQXlFO1lBQ3pFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDNUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLGlCQUFpQixDQUFDLFlB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