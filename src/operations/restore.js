"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var lodashSet = require("lodash.set");
var lodashFindIndex = require("lodash.findindex");
var CacheSnapshot_1 = require("../CacheSnapshot");
var GraphSnapshot_1 = require("../GraphSnapshot");
var nodes_1 = require("../nodes");
var OptimisticUpdateQueue_1 = require("../OptimisticUpdateQueue");
var util_1 = require("../util");
/**
 * Restore GraphSnapshot from serializable representation.
 *
 * The parameter 'serializedState' is likely to be result running JSON.stringify
 * on a result of 'extract' method. This function will directly reference object
 * in the serializedState.
 *
 * @throws Will throw an error if 'type' in serializedState cannot be mapped to
 *    different sub-class of NodeSnapshot.
 * @throws Will throw an error if there is undefined in sparse array
 */
function restore(serializedState, cacheContext) {
    var _a = createGraphSnapshotNodes(serializedState, cacheContext), nodesMap = _a.nodesMap, editedNodeIds = _a.editedNodeIds;
    var graphSnapshot = new GraphSnapshot_1.GraphSnapshot(nodesMap);
    return {
        cacheSnapshot: new CacheSnapshot_1.CacheSnapshot(graphSnapshot, graphSnapshot, new OptimisticUpdateQueue_1.OptimisticUpdateQueue()),
        editedNodeIds: editedNodeIds,
    };
}
exports.restore = restore;
function createGraphSnapshotNodes(serializedState, cacheContext) {
    var nodesMap = Object.create(null);
    var editedNodeIds = new Set();
    // Create entity nodes in the GraphSnapshot
    for (var nodeId in serializedState) {
        var _a = serializedState[nodeId], type = _a.type, data = _a.data, inbound = _a.inbound, outbound = _a.outbound;
        var nodeSnapshot = void 0;
        switch (type) {
            case 0 /* EntitySnapshot */:
                nodeSnapshot = new nodes_1.EntitySnapshot(data, inbound, outbound);
                break;
            case 1 /* ParameterizedValueSnapshot */:
                nodeSnapshot = new nodes_1.ParameterizedValueSnapshot(data, inbound, outbound);
                break;
            default:
                throw new Error("Invalid Serializable.NodeSnapshotType " + type + " at " + nodeId);
        }
        nodesMap[nodeId] = nodeSnapshot;
        editedNodeIds.add(nodeId);
    }
    // Patch data property and reconstruct references
    restoreEntityReferences(nodesMap, cacheContext);
    return { nodesMap: nodesMap, editedNodeIds: editedNodeIds };
}
function restoreEntityReferences(nodesMap, cacheContext) {
    var entityTransformer = cacheContext.entityTransformer, entityIdForValue = cacheContext.entityIdForValue;
    for (var nodeId in nodesMap) {
        var _a = nodesMap[nodeId], data = _a.data, outbound = _a.outbound;
        if (entityTransformer && util_1.isObject(data) && entityIdForValue(data)) {
            entityTransformer(data);
        }
        // If it doesn't have outbound then 'data' doesn't have any references
        // If it is 'undefined' means that there is no data value
        // in both cases, there is no need for modification.
        if (!outbound || data === undefined) {
            continue;
        }
        try {
            for (var outbound_1 = tslib_1.__values(outbound), outbound_1_1 = outbound_1.next(); !outbound_1_1.done; outbound_1_1 = outbound_1.next()) {
                var _b = outbound_1_1.value, referenceId = _b.id, path = _b.path;
                var referenceNode = nodesMap[referenceId];
                if (referenceNode instanceof nodes_1.EntitySnapshot && data === null) {
                    // data is a reference.
                    nodesMap[nodeId].data = referenceNode.data;
                }
                else if (referenceNode instanceof nodes_1.ParameterizedValueSnapshot) {
                    // This is specifically to handle a sparse array which happen
                    // when each element in the array reference data in a
                    // ParameterizedValueSnapshot.
                    // (see: parameterizedFields/nestedParameterizedReferenceInArray.ts)
                    // We only want to try walking if its data contains an array
                    var indexToArrayIndex = lodashFindIndex(path, util_1.isNumber);
                    if (indexToArrayIndex !== -1) {
                        tryRestoreSparseArray(data, path, 0);
                    }
                }
                else if (Array.isArray(data) || util_1.isObject(data)) {
                    lodashSet(data, path, referenceNode.data);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (outbound_1_1 && !outbound_1_1.done && (_c = outbound_1.return)) _c.call(outbound_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    var e_1, _c;
}
/**
 * Helper function to walk 'data' according to the given path
 * and try to recreate sparse array when encounter 'null' in array along
 * the path.
 *
 * The function assumes that the given data already has the shape of the path
 * For example:
 *    path -> ['one', 0, 'two', 1] will be with
 *    data ->
 *    { one: [
 *        two: [null, <some data>]
 *    ]}
 *
 * This is garunteed to be such a case because when we extract sparse array,
 * we will set 'undefined' as value of an array which will then be
 * JSON.stringify to 'null' and will preserve the structure along the path
 *
 */
function tryRestoreSparseArray(data, possibleSparseArrayPaths, idx) {
    if (data === undefined) {
        // There should never be 'undefined'
        throw new Error("Unexpected 'undefined' in the path [" + possibleSparseArrayPaths + "] at index " + idx);
    }
    if (idx >= possibleSparseArrayPaths.length || data === null || util_1.isScalar(data)) {
        return;
    }
    var prop = possibleSparseArrayPaths[idx];
    if (Array.isArray(data) && typeof prop === 'number' && data[prop] === null) {
        // truely make it sparse rather than just set "undefined'"
        delete data[prop];
        return;
    }
    tryRestoreSparseArray(data[prop], possibleSparseArrayPaths, idx + 1);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdG9yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsc0NBQXlDO0FBQ3pDLGtEQUFxRDtBQUVyRCxrREFBaUQ7QUFFakQsa0RBQWtFO0FBQ2xFLGtDQUFzRTtBQUN0RSxrRUFBaUU7QUFHakUsZ0NBQXVEO0FBRXZEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxpQkFBd0IsZUFBMkMsRUFBRSxZQUEwQjtJQUN2RixJQUFBLDREQUFxRixFQUFuRixzQkFBUSxFQUFFLGdDQUFhLENBQTZEO0lBQzVGLElBQU0sYUFBYSxHQUFHLElBQUksNkJBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUVsRCxNQUFNLENBQUM7UUFDTCxhQUFhLEVBQUUsSUFBSSw2QkFBYSxDQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsSUFBSSw2Q0FBcUIsRUFBRSxDQUFDO1FBQzNGLGFBQWEsZUFBQTtLQUNkLENBQUM7QUFDSixDQUFDO0FBUkQsMEJBUUM7QUFFRCxrQ0FBa0MsZUFBMkMsRUFBRSxZQUEwQjtJQUN2RyxJQUFNLFFBQVEsR0FBb0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0RCxJQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO0lBRXhDLDJDQUEyQztJQUMzQyxHQUFHLENBQUMsQ0FBQyxJQUFNLE1BQU0sSUFBSSxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQy9CLElBQUEsNEJBQTJELEVBQXpELGNBQUksRUFBRSxjQUFJLEVBQUUsb0JBQU8sRUFBRSxzQkFBUSxDQUE2QjtRQUVsRSxJQUFJLFlBQVksU0FBQSxDQUFDO1FBQ2pCLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDYjtnQkFDRSxZQUFZLEdBQUcsSUFBSSxzQkFBYyxDQUFDLElBQWtCLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN6RSxLQUFLLENBQUM7WUFDUjtn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