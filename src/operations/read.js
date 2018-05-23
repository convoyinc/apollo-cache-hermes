"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var lodashGet = require("lodash.get");
var schema_1 = require("../schema");
var util_1 = require("../util");
var SnapshotEditor_1 = require("./SnapshotEditor");
function read(context, raw, snapshot, includeNodeIds) {
    if (includeNodeIds === void 0) { includeNodeIds = true; }
    var tracerContext;
    if (context.tracer.readStart) {
        tracerContext = context.tracer.readStart(raw);
    }
    var operation = context.parseOperation(raw);
    var queryResult = snapshot.readCache.get(operation);
    var cacheHit = true;
    if (!queryResult) {
        cacheHit = false;
        var staticResult = snapshot.getNodeData(operation.rootId);
        var result = staticResult;
        var nodeIds = includeNodeIds ? new Set() : undefined;
        if (!operation.isStatic) {
            result = _walkAndOverlayDynamicValues(operation, context, snapshot, staticResult, nodeIds);
        }
        var complete = _visitSelection(operation, context, result, nodeIds);
        queryResult = { result: result, complete: complete, nodeIds: nodeIds };
        snapshot.readCache.set(operation, queryResult);
    }
    // We can potentially ask for results without node ids first, and then follow
    // up with an ask for them.  In that case, we need to fill in the cache a bit
    // more.
    if (includeNodeIds && !queryResult.nodeIds) {
        cacheHit = false;
        var nodeIds = new Set();
        var complete = _visitSelection(operation, context, queryResult.result, nodeIds);
        queryResult.complete = complete;
        queryResult.nodeIds = nodeIds;
    }
    if (context.tracer.readEnd) {
        var result = { result: queryResult, cacheHit: cacheHit };
        context.tracer.readEnd(operation, result, tracerContext);
    }
    return queryResult;
}
exports.read = read;
var OverlayWalkNode = /** @class */ (function () {
    function OverlayWalkNode(value, containerId, parsedMap, path) {
        this.value = value;
        this.containerId = containerId;
        this.parsedMap = parsedMap;
        this.path = path;
    }
    return OverlayWalkNode;
}());
/**
 * Walks a parameterized field map, overlaying values at those paths on top of
 * existing results.
 *
 * Overlaid values are objects with prototypes pointing to the original results,
 * and new properties pointing to the parameterized values (or objects that
 * contain them).
 */
function _walkAndOverlayDynamicValues(query, context, snapshot, result, nodeIds) {
    // Corner case: We stop walking once we reach a parameterized field with no
    // snapshot, but we should also preemptively stop walking if there are no
    // dynamic values to be overlaid
    var rootSnapshot = snapshot.getNodeSnapshot(query.rootId);
    if (util_1.isNil(rootSnapshot))
        return result;
    // TODO: A better approach here might be to walk the outbound references from
    // each node, rather than walking the result set.  We'd have to store the path
    // on parameterized value nodes to make that happen.
    var newResult = _wrapValue(result, context);
    // TODO: This logic sucks.  We'd do much better if we had knowledge of the
    // schema.  Can we layer that on in such a way that we can support uses w/ and
    // w/o a schema compilation step?
    var queue = [new OverlayWalkNode(newResult, query.rootId, query.parsedQuery, [])];
    while (queue.length) {
        var walkNode = queue.pop();
        var value = walkNode.value, parsedMap = walkNode.parsedMap;
        var containerId = walkNode.containerId, path = walkNode.path;
        var valueId = context.entityIdForValue(value);
        if (valueId) {
            containerId = valueId;
            path = [];
        }
        for (var key in parsedMap) {
            var node = parsedMap[key];
            if (node.excluded) {
                continue;
            }
            var child = void 0;
            var fieldName = key;
            // This is an alias if we have a schemaName declared.
            fieldName = node.schemaName ? node.schemaName : key;
            var nextContainerId = containerId;
            var nextPath = path;
            if (node.args) {
                var childId = SnapshotEditor_1.nodeIdForParameterizedValue(containerId, tslib_1.__spread(path, [fieldName]), node.args);
                var childSnapshot = snapshot.getNodeSnapshot(childId);
                if (!childSnapshot) {
                    var typeName = value.__typename;
                    if (!typeName && containerId === schema_1.StaticNodeId.QueryRoot) {
                        typeName = 'Query'; // Preserve the default cache's behavior.
                    }
                    // Should we fall back to a redirect?
                    var redirect = lodashGet(context.resolverRedirects, [typeName, fieldName]);
                    if (redirect) {
                        childId = redirect(node.args);
                        if (!util_1.isNil(childId)) {
                            childSnapshot = snapshot.getNodeSnapshot(childId);
                        }
                    }
                }
                // Still no snapshot? Ok we're done here.
                if (!childSnapshot)
                    continue;
                if (nodeIds)
                    nodeIds.add(childId);
                nextContainerId = childId;
                nextPath = [];
                child = childSnapshot.data;
            }
            else {
                nextPath = tslib_1.__spread(path, [fieldName]);
                child = value[fieldName];
            }
            // Have we reached a leaf (either in the query, or in the cache)?
            if (node.hasParameterizedChildren && node.children && child !== null) {
                if (Array.isArray(child)) {
                    child = tslib_1.__spread(child);
                    for (var i = child.length - 1; i >= 0; i--) {
                        if (child[i] === null)
                            continue;
                        child[i] = _wrapValue(child[i], context);
                        queue.push(new OverlayWalkNode(child[i], nextContainerId, node.children, tslib_1.__spread(nextPath, [i])));
                    }
                }
                else {
                    child = _wrapValue(child, context);
                    queue.push(new OverlayWalkNode(child, nextContainerId, node.children, nextPath));
                }
            }
            // Because key is already a field alias, result will be written correctly
            // using alias as key.
            value[key] = child;
        }
    }
    return newResult;
}
exports._walkAndOverlayDynamicValues = _walkAndOverlayDynamicValues;
function _wrapValue(value, context) {
    if (value === undefined)
        return {};
    if (Array.isArray(value))
        return tslib_1.__spread(value);
    if (util_1.isObject(value)) {
        var newValue = tslib_1.__assign({}, value);
        if (context.entityTransformer && context.entityIdForValue(value)) {
            context.entityTransformer(newValue);
        }
        return newValue;
    }
    return value;
}
/**
 * Determines whether `result` satisfies the properties requested by
 * `selection`.
 */
function _visitSelection(query, context, result, nodeIds) {
    var complete = true;
    if (nodeIds && result !== undefined) {
        nodeIds.add(query.rootId);
    }
    // TODO: Memoize per query, and propagate through cache snapshots.
    util_1.walkOperation(query.parsedQuery, result, function (value, fields) {
        if (value === undefined) {
            complete = false;
        }
        // If we're not including node ids, we can stop the walk right here.
        if (!complete)
            return !nodeIds;
        if (!util_1.isObject(value))
            return false;
        if (nodeIds && util_1.isObject(value)) {
            var nodeId = context.entityIdForValue(value);
            if (nodeId !== undefined) {
                nodeIds.add(nodeId);
            }
        }
        try {
            for (var fields_1 = tslib_1.__values(fields), fields_1_1 = fields_1.next(); !fields_1_1.done; fields_1_1 = fields_1.next()) {
                var field = fields_1_1.value;
                if (!(field in value)) {
                    complete = false;
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (fields_1_1 && !fields_1_1.done && (_a = fields_1.return)) _a.call(fields_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return false;
        var e_1, _a;
    });
    return complete;
}
exports._visitSelection = _visitSelection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsc0NBQXlDO0FBTXpDLG9DQUFrRjtBQUNsRixnQ0FBeUQ7QUFFekQsbURBQStEO0FBa0IvRCxjQUFxQixPQUFxQixFQUFFLEdBQWlCLEVBQUUsUUFBdUIsRUFBRSxjQUFxQjtJQUFyQiwrQkFBQSxFQUFBLHFCQUFxQjtJQUMzRyxJQUFJLGFBQWEsQ0FBQztJQUNsQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsYUFBYSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRCxJQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzlDLElBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBb0MsQ0FBQztJQUN2RixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUM7SUFDcEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ2pCLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDakIsSUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFNUQsSUFBSSxNQUFNLEdBQUcsWUFBWSxDQUFDO1FBQzFCLElBQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLEVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQy9ELEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDeEIsTUFBTSxHQUFHLDRCQUE0QixDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFB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