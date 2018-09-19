"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var lodashGet = require("lodash.get");
var schema_1 = require("../schema");
var util_1 = require("../util");
var SnapshotEditor_1 = require("./SnapshotEditor");
function read(context, raw, snapshot, includeNodeIds) {
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
        if (!operation.isStatic) {
            result = _walkAndOverlayDynamicValues(operation, context, snapshot, staticResult);
        }
        var _a = _visitSelection(operation, context, result, includeNodeIds), complete = _a.complete, nodeIds = _a.nodeIds;
        queryResult = { result: result, complete: complete, nodeIds: nodeIds };
        snapshot.readCache.set(operation, queryResult);
    }
    // We can potentially ask for results without node ids first, and then follow
    // up with an ask for them.  In that case, we need to fill in the cache a bit
    // more.
    if (includeNodeIds && !queryResult.nodeIds) {
        cacheHit = false;
        var _b = _visitSelection(operation, context, queryResult.result, includeNodeIds), complete = _b.complete, nodeIds = _b.nodeIds;
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
function _walkAndOverlayDynamicValues(query, context, snapshot, result) {
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
            var child = void 0;
            var fieldName = key;
            // This is an alias if we have a schemaName declared.
            fieldName = node.schemaName ? node.schemaName : key;
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
                child = childSnapshot.data;
            }
            else {
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
                        queue.push(new OverlayWalkNode(child[i], containerId, node.children, tslib_1.__spread(path, [fieldName, i])));
                    }
                }
                else {
                    child = _wrapValue(child, context);
                    queue.push(new OverlayWalkNode(child, containerId, node.children, tslib_1.__spread(path, [fieldName])));
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
function _visitSelection(query, context, result, includeNodeIds) {
    var complete = true;
    var nodeIds;
    if (includeNodeIds) {
        nodeIds = new Set();
        if (result !== undefined) {
            nodeIds.add(query.rootId);
        }
    }
    // TODO: Memoize per query, and propagate through cache snapshots.
    util_1.walkOperation(query.info.parsed, result, function (value, fields) {
        if (value === undefined) {
            complete = false;
        }
        // If we're not including node ids, we can stop the walk right here.
        if (!complete)
            return !includeNodeIds;
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
    return { complete: complete, nodeIds: nodeIds };
}
exports._visitSelection = _visitSelection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsc0NBQXlDO0FBTXpDLG9DQUFrRjtBQUNsRixnQ0FBeUQ7QUFFekQsbURBQStEO0FBbUIvRCxjQUFxQixPQUFxQixFQUFFLEdBQWlCLEVBQUUsUUFBdUIsRUFBRSxjQUFxQjtJQUMzRyxJQUFJLGFBQWEsQ0FBQztJQUNsQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsYUFBYSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRCxJQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzlDLElBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBb0MsQ0FBQztJQUN2RixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUM7SUFDcEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ2pCLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDakIsSUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFNUQsSUFBSSxNQUFNLEdBQUcsWUFBWSxDQUFDO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDeEIsTUFBTSxHQUFHLDRCQUE0QixDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3BGLENBQUM7UUFFSyxJQUFBLGdFQUFtRixFQUFqRixzQkFBUSxFQUFFLG9CQUFPLENBQWlFO1FBRTFGLFdBQVcsR0FBRyxFQUFFLE1BQU0sUUFBQSxFQUFFLFFBQVEs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