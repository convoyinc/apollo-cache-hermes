"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var lodashGet = require("lodash.get");
/**
 * Gets a nested value, with support for blank paths.
 */
function deepGet(target, path) {
    return path.length ? lodashGet(target, path) : target;
}
exports.deepGet = deepGet;
function pathBeginsWith(target, prefix) {
    if (target.length < prefix.length)
        return false;
    for (var i = 0; i < prefix.length; i++) {
        if (prefix[i] !== target[i])
            return false;
    }
    return true;
}
exports.pathBeginsWith = pathBeginsWith;
/**
 * Adds values to a set, mutating it.
 */
function addToSet(target, source) {
    try {
        for (var source_1 = tslib_1.__values(source), source_1_1 = source_1.next(); !source_1_1.done; source_1_1 = source_1.next()) {
            var value = source_1_1.value;
            target.add(value);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (source_1_1 && !source_1_1.done && (_a = source_1.return)) _a.call(source_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var e_1, _a;
}
exports.addToSet = addToSet;
/**
 * An immutable deep set, where it only creates containers (objects/arrays) if
 * they differ from the _original_ object copied from - even if
 * `_setValue` is called against it multiple times.
 */
function lazyImmutableDeepSet(target, original, path, value) {
    if (!path.length)
        return value;
    var parentNode;
    var targetNode = target;
    var originalNode = original;
    // We assume that the last path component is the key of a value; not a
    // container, so we stop there.
    for (var i = 0; i < path.length; i++) {
        var key = path[i];
        // If the target still references the original's objects, we need to diverge
        if (!targetNode || targetNode === originalNode) {
            if (typeof key === 'number') {
                targetNode = originalNode ? tslib_1.__spread(originalNode) : [];
            }
            else if (typeof key === 'string') {
                targetNode = originalNode ? tslib_1.__assign({}, originalNode) : {};
            }
            else {
                throw new Error("Unknown path type " + JSON.stringify(key) + " in path " + JSON.stringify(path) + " at index " + i);
            }
            if (i === 0) {
                // Make sure we have a reference to the new target. We can keep the
                // reference here because "target" is pointing as currentNode.data.
                target = targetNode;
            }
            else {
                parentNode[path[i - 1]] = targetNode;
            }
        }
        // Regardless, we keep walking deeper.
        parentNode = targetNode;
        targetNode = targetNode[key];
        originalNode = originalNode && originalNode[key];
    }
    // Finally, set the value in our previously or newly cloned target.
    parentNode[path[path.length - 1]] = value;
    return target;
}
exports.lazyImmutableDeepSet = lazyImmutableDeepSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsc0NBQXlDO0FBSXpDOztHQUVHO0FBQ0gsaUJBQXdCLE1BQVcsRUFBRSxJQUFnQjtJQUNuRCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ3hELENBQUM7QUFGRCwwQkFFQztBQUVELHdCQUErQixNQUFrQixFQUFFLE1BQWtCO0lBQ25FLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDaEQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDdkMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDNUMsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBTkQsd0NBTUM7QUFFRDs7R0FFRztBQUNILGtCQUE0QixNQUFjLEVBQUUsTUFBbUI7O1FBQzdELEdBQUcsQ0FBQyxDQUFnQixJQUFBLFdBQUEsaUJBQUEsTUFBTSxDQUFBLDhCQUFBO1lBQXJCLElBQU0sS0FBSyxtQkFBQTtZQUNkLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDbkI7Ozs7Ozs7Ozs7QUFDSCxDQUFDO0FBSkQsNEJBSUM7QUFFRDs7OztHQUlHO0FBQ0gsOEJBQ0UsTUFBMkIsRUFDM0IsUUFBNkIsRUFDN0IsSUFBZ0IsRUFDaEIsS0FBVTtJQUVWLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFFL0IsSUFBSSxVQUFVLENBQUM7SUFDZixJQUFJLFVBQVUsR0FBUSxNQUFNLENBQUM7SUFDN0IsSUFBSSxZQUFZLEdBQVEsUUFBUSxDQUFDO0lBQ2pDLHNFQUFzRTtJQUN0RSwrQkFBK0I7SUFDL0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDckMsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLDRFQUE0RTtRQUM1RSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsSUFBSSxVQUFVLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQztZQUMvQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixVQUFVLEdBQUcsWUFBWSxDQUFDLENBQUMsa0JBQUssWUFBWSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDckQsQ0FBQztZQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxVQUFVLEdBQUcsWUFBWSxDQUFDLENBQUMsc0JBQU0sWUFBWSxFQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDdkQsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXFCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFZLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGtCQUFhLENBQUcsQ0FBQyxDQUFDO1lBQzVHLENBQUM7WUFFRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWixtRUFBbUU7Z0JBQ25FLG1FQUFtRTtnQkFDbkUsTUFBTSxHQUFHLFVBQVUsQ0FBQztZQUN0QixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUM7WUFDdkMsQ0FBQztRQUNILENBQUM7UUFFRCxzQ0FBc0M7UUFDdEMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUN4QixVQUFVLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLFlBQVksR0FBRyxZQUFZLElBQUksWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRCxtRUFBbUU7SUFDbkUsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBRTFDLE1BQU0sQ0FBQyxNQUFpQixDQUFDO0FBQzNCLENBQUM7QUE1Q0Qsb0RBNENDIn0=