"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var apollo_utilities_1 = require("apollo-utilities");
var errors_1 = require("../errors");
var GraphSnapshot_1 = require("../GraphSnapshot");
var nodes_1 = require("../nodes");
var util_1 = require("../util");
/**
 * Builds a set of changes to apply on top of an existing `GraphSnapshot`.
 *
 * Performs the minimal set of edits to generate new immutable versions of each
 * node, while preserving immutability of the parent snapshot.
 */
var SnapshotEditor = /** @class */ (function () {
    function SnapshotEditor(
        /** The configuration/context to use when editing snapshots. */
        _context, 
        /** The snapshot to base edits off of. */
        _parent) {
        this._context = _context;
        this._parent = _parent;
        /**
         * Tracks all node snapshots that have changed vs the parent snapshot.
         */
        this._newNodes = Object.create(null);
        /**
         * Tracks the nodes that have new _values_ vs the parent snapshot.
         *
         * This is a subset of the keys in `_newValues`.  The difference is all nodes
         * that have only changed references.
         */
        this._editedNodeIds = new Set();
        /**
         * Tracks the nodes that have been rebuilt, and have had all their inbound
         * references updated to point to the new value.
         */
        this._rebuiltNodeIds = new Set();
        /** The queries that were written, and should now be considered complete. */
        this._writtenQueries = new Set();
    }
    /**
     * Merge a GraphQL payload (query/fragment/etc) into the snapshot, rooted at
     * the node identified by `rootId`.
     */
    SnapshotEditor.prototype.mergePayload = function (query, payload) {
        var parsed = this._context.parseOperation(query);
        // We collect all warnings associated with this operation to avoid
        // overwhelming the log for particularly nasty payloads.
        var warnings = [];
        // First, we walk the payload and apply all _scalar_ edits, while collecting
        // all references that have changed.  Reference changes are applied later,
        // once all new nodes have been built (and we can guarantee that we're
        // referencing the correct version).
        var referenceEdits = [];
        this._mergeSubgraph({} /* visitedSubgraphs */, referenceEdits, warnings, parsed.rootId, [] /* prefixPath */, [] /* path */, parsed.parsedQuery, payload);
        // Now that we have new versions of every edited node, we can point all the
        // edited references to the correct nodes.
        //
        // In addition, this performs bookkeeping the inboundReferences of affected
        // nodes, and collects all newly orphaned nodes.
        var orphanedNodeIds = this._mergeReferenceEdits(referenceEdits);
        // Remove (garbage collect) orphaned subgraphs.
        this._removeOrphanedNodes(orphanedNodeIds);
        // The query should now be considered complete for future reads.
        this._writtenQueries.add(parsed);
        // Don't emit empty arrays for easy testing upstream.
        return warnings.length ? { warnings: warnings } : {};
    };
    /**
     * Merge a payload (subgraph) into the cache, following the parsed form of the
     * operation.
     */
    SnapshotEditor.prototype._mergeSubgraph = function (visitedSubgraphs, referenceEdits, warnings, containerId, prefixPath, path, parsed, payload) {
        // Don't trust our inputs; we can receive values that aren't JSON
        // serializable via optimistic updates.
        if (payload === undefined) {
            payload = null;
        }
        // We should only ever reach a subgraph if it is a container (object/array).
        if (typeof payload !== 'object') {
            var message = "Received a " + typeof payload + " value, but expected an object/array/null";
            throw new errors_1.InvalidPayloadError(message, prefixPath, containerId, path, payload);
        }
        // TODO(ianm): We're doing this a lot.  How much is it impacting perf?
        var previousValue = util_1.deepGet(this._getNodeData(containerId), path);
        // Recurse into arrays.
        if (Array.isArray(payload) || Array.isArray(previousValue)) {
            if (!util_1.isNil(previousValue) && !Array.isArray(previousValue)) {
                throw new errors_1.InvalidPayloadError("Unsupported transition from a non-list to list value", prefixPath, containerId, path, payload);
            }
            if (!util_1.isNil(payload) && !Array.isArray(payload)) {
                throw new errors_1.InvalidPayloadError("Unsupported transition from a list to a non-list value", prefixPath, containerId, path, payload);
            }
            this._mergeArraySubgraph(visitedSubgraphs, referenceEdits, warnings, containerId, prefixPath, path, parsed, payload, previousValue);
            return;
        }
        var payloadId = this._context.entityIdForValue(payload);
        var previousId = this._context.entityIdForValue(previousValue);
        // TODO(jamesreggio): Does `excluded` need to evaluated before this?
        // Is this an identity change?
        if (payloadId !== previousId) {
            // It is invalid to transition from a *value* with an id to one without.
            if (!util_1.isNil(payload) && !payloadId) {
                var message = "Unsupported transition from an entity to a non-entity value";
                throw new errors_1.InvalidPayloadError(message, prefixPath, containerId, path, payload);
            }
            // The reverse is also invalid.
            if (!util_1.isNil(previousValue) && !previousId) {
                var message = "Unsupported transition from a non-entity value to an entity";
                throw new errors_1.InvalidPayloadError(message, prefixPath, containerId, path, payload);
            }
            // Double check that our id generator is behaving properly.
            if (payloadId && util_1.isNil(payload)) {
                throw new errors_1.OperationError("entityIdForNode emitted an id for a nil payload value", prefixPath, containerId, path, payload);
            }
            // Fix references. See: orphan node tests on "orphan a subgraph" The new
            // value is null and the old value is an entity. We will want to remove
            // reference to such entity
            referenceEdits.push({
                containerId: containerId,
                path: path,
                prevNodeId: previousId,
                nextNodeId: payloadId,
            });
            // Nothing more to do here; the reference edit will null out this field.
            if (!payloadId)
                return;
            // End of the line for a non-reference.
        }
        else if (util_1.isNil(payload)) {
            if (previousValue !== null) {
                this._setValue(containerId, path, null, true);
            }
            return;
        }
        // Return early if we've already written payloadId with the given query.
        if (payloadId) {
            if (!visitedSubgraphs[payloadId]) {
                visitedSubgraphs[payloadId] = new Set();
            }
            if (visitedSubgraphs[payloadId].has(parsed)) {
                return;
            }
            visitedSubgraphs[payloadId].add(parsed);
        }
        // If we've entered a new node; it becomes our container.
        if (payloadId) {
            prefixPath = tslib_1.__spread(prefixPath, path);
            containerId = payloadId;
            path = [];
        }
        // Finally, we can walk into individual values.
        for (var payloadName in parsed) {
            var node = parsed[payloadName];
            if (node.excluded) {
                continue;
            }
            // Having a schemaName on the node implies that payloadName is an alias.
            var schemaName = node.schemaName ? node.schemaName : payloadName;
            var fieldValue = util_1.deepGet(payload, [payloadName]);
            // Don't trust our inputs.  Ensure that missing values are null.
            if (fieldValue === undefined) {
                fieldValue = null;
                // And if it was explicitly undefined, that likely indicates a malformed
                // input (mutation, direct write).
                if (payload && payloadName in payload) {
                    warnings.push("Encountered undefined at " + tslib_1.__spread(prefixPath, path).join('.') + ". Treating as null");
                }
            }
            var containerIdForField = containerId;
            // For static fields, we append the current cacheKey to create a new path
            // to the field.
            //
            //   user: {
            //     name: 'Bob',   -> fieldPath: ['user', 'name']
            //     address: {     -> fieldPath: ['user', 'address']
            //       city: 'A',   -> fieldPath: ['user', 'address', 'city']
            //       state: 'AB', -> fieldPath: ['user', 'address', 'state']
            //     },
            //     info: {
            //       id: 0,       -> fieldPath: ['id']
            //       prop1: 'hi'  -> fieldPath: ['prop1']
            //     },
            //     history: [
            //       {
            //         postal: 123 -> fieldPath: ['user', 'history', 0, 'postal']
            //       },
            //       {
            //         postal: 456 -> fieldPath: ['user', 'history', 1, 'postal']
            //       }
            //     ],
            //     phone: [
            //       '1234', -> fieldPath: ['user', 0]
            //       '5678', -> fieldPath: ['user', 1]
            //     ],
            //   },
            //
            // Similarly, something to keep in mind is that parameterized nodes
            // (instances of ParameterizedValueSnapshot) can have direct references to
            // an entity node's value.
            //
            // For example, with the query:
            //
            //   foo(id: 1) { id, name }
            //
            // The cache would have:
            //
            //   1: {
            //     data: { id: 1, name: 'Foo' },
            //   },
            //   'ROOT_QUERY❖["foo"]❖{"id":1}': {
            //     data: // a direct reference to the node of entity '1'.
            //   },
            //
            // This allows us to rely on standard behavior for entity references: If
            // node '1' is edited, the parameterized node must also be edited.
            // Similarly, the parameterized node contains an outbound reference to the
            // entity node, for garbage collection.
            var fieldPrefixPath = prefixPath;
            var fieldPath = tslib_1.__spread(path, [schemaName]);
            if (node.args) {
                // The values of a parameterized field are explicit nodes in the graph;
                // so we set up a new container & path.
                containerIdForField = this._ensureParameterizedValueSnapshot(containerId, fieldPath, node.args);
                fieldPrefixPath = tslib_1.__spread(prefixPath, fieldPath);
                fieldPath = [];
            }
            // Note that we're careful to fetch the value of our new container; not
            // the outer container.
            var previousFieldValue = util_1.deepGet(this._getNodeData(containerIdForField), fieldPath);
            // For fields with sub selections, we walk into them; only leaf fields are
            // directly written via _setValue.  This allows us to perform minimal
            // edits to the graph.
            if (node.children) {
                this._mergeSubgraph(visitedSubgraphs, referenceEdits, warnings, containerIdForField, fieldPrefixPath, fieldPath, node.children, fieldValue);
                // We've hit a leaf field.
                //
                // Note that we must perform a _deep_ equality check here, to cover cases
                // where a leaf value is a complex object.
            }
            else if (!apollo_utilities_1.isEqual(fieldValue, previousFieldValue)) {
                // We intentionally do not deep copy the nodeValue as Apollo will
                // then perform Object.freeze anyway. So any change in the payload
                // value afterward will be reflect in the graph as well.
                //
                // We use selection.name.value instead of payloadKey so that we
                // always write to cache using real field name rather than alias
                // name.
                this._setValue(containerIdForField, fieldPath, fieldValue);
            }
        }
    };
    /**
     * Merge an array from the payload (or previous cache data).
     */
    SnapshotEditor.prototype._mergeArraySubgraph = function (visitedSubgraphs, referenceEdits, warnings, containerId, prefixPath, path, parsed, payload, previousValue) {
        if (util_1.isNil(payload)) {
            // Note that we mark this as an edit, as this method is only ever called
            // if we've determined the value to be an array (which means that
            // previousValue MUST be an array in this case).
            this._setValue(containerId, path, null, true);
            return;
        }
        var payloadLength = payload ? payload.length : 0;
        var previousLength = previousValue ? previousValue.length : 0;
        // Note that even though we walk into arrays, we need to be
        // careful to ensure that we don't leave stray values around if
        // the new array is of a different length.
        //
        // So, we resize the array to our desired size before walking.
        if (payloadLength !== previousLength || !previousValue) {
            var newArray = Array.isArray(previousValue)
                ? previousValue.slice(0, payloadLength) : new Array(payloadLength);
            this._setValue(containerId, path, newArray);
            // Drop any extraneous references.
            if (payloadLength < previousLength) {
                this._removeArrayReferences(referenceEdits, containerId, path, payloadLength - 1);
            }
        }
        // Note that we're careful to iterate over all indexes, in case this is a
        // sparse array.
        for (var i = 0; i < payload.length; i++) {
            var childPayload = payload[i];
            if (childPayload === undefined) {
                // Undefined values in an array are strictly invalid; and likely
                // indicate a malformed input (mutation, direct write).
                childPayload = null;
                if (i in payload) {
                    warnings.push("Encountered undefined at " + tslib_1.__spread(path, [i]).join('.') + ". Treating as null");
                }
                else {
                    warnings.push("Encountered hole in array at " + tslib_1.__spread(path, [i]).join('.') + ". Filling with null");
                }
            }
            this._mergeSubgraph(visitedSubgraphs, referenceEdits, warnings, containerId, prefixPath, tslib_1.__spread(path, [i]), parsed, childPayload);
        }
    };
    /**
     *
     */
    SnapshotEditor.prototype._removeArrayReferences = function (referenceEdits, containerId, prefix, afterIndex) {
        var container = this._getNodeSnapshot(containerId);
        if (!container || !container.outbound)
            return;
        try {
            for (var _a = tslib_1.__values(container.outbound), _b = _a.next(); !_b.done; _b = _a.next()) {
                var reference = _b.value;
                if (!util_1.pathBeginsWith(reference.path, prefix))
                    continue;
                var index = reference.path[prefix.length];
                if (typeof index !== 'number')
                    continue;
                if (index <= afterIndex)
                    continue;
                // At this point, we've got a reference beyond the array's new bounds.
                referenceEdits.push({
                    containerId: containerId,
                    path: reference.path,
                    prevNodeId: reference.id,
                    nextNodeId: undefined,
                    noWrite: true,
                });
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
    /**
     * Update all nodes with edited references, and ensure that the bookkeeping of
     * the new and _past_ references are properly updated.
     *
     * Returns the set of node ids that are newly orphaned by these edits.
     */
    SnapshotEditor.prototype._mergeReferenceEdits = function (referenceEdits) {
        var orphanedNodeIds = new Set();
        try {
            for (var referenceEdits_1 = tslib_1.__values(referenceEdits), referenceEdits_1_1 = referenceEdits_1.next(); !referenceEdits_1_1.done; referenceEdits_1_1 = referenceEdits_1.next()) {
                var _a = referenceEdits_1_1.value, containerId = _a.containerId, path = _a.path, prevNodeId = _a.prevNodeId, nextNodeId = _a.nextNodeId, noWrite = _a.noWrite;
                if (!noWrite) {
                    var target = nextNodeId ? this._getNodeData(nextNodeId) : null;
                    this._setValue(containerId, path, target);
                }
                var container = this._ensureNewSnapshot(containerId);
                if (prevNodeId) {
                    util_1.removeNodeReference('outbound', container, prevNodeId, path);
                    var prevTarget = this._ensureNewSnapshot(prevNodeId);
                    util_1.removeNodeReference('inbound', prevTarget, containerId, path);
                    if (!prevTarget.inbound) {
                        orphanedNodeIds.add(prevNodeId);
                    }
                }
                if (nextNodeId) {
                    util_1.addNodeReference('outbound', container, nextNodeId, path);
                    var nextTarget = this._ensureNewSnapshot(nextNodeId);
                    util_1.addNodeReference('inbound', nextTarget, containerId, path);
                    orphanedNodeIds.delete(nextNodeId);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (referenceEdits_1_1 && !referenceEdits_1_1.done && (_b = referenceEdits_1.return)) _b.call(referenceEdits_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return orphanedNodeIds;
        var e_2, _b;
    };
    /**
     * Commits the transaction, returning a new immutable snapshot.
     */
    SnapshotEditor.prototype.commit = function () {
        // At this point, every node that has had any of its properties change now
        // exists in _newNodes.  In order to preserve immutability, we need to walk
        // all nodes that transitively reference an edited node, and update their
        // references to point to the new version.
        this._rebuildInboundReferences();
        var snapshot = this._buildNewSnapshot();
        if (this._context.freezeSnapshots) {
            snapshot.freeze();
        }
        return {
            snapshot: snapshot,
            editedNodeIds: this._editedNodeIds,
            writtenQueries: this._writtenQueries,
        };
    };
    /**
     * Collect all our pending changes into a new GraphSnapshot.
     */
    SnapshotEditor.prototype._buildNewSnapshot = function () {
        var entityTransformer = this._context.entityTransformer;
        var snapshots = tslib_1.__assign({}, this._parent._values);
        for (var id in this._newNodes) {
            var newSnapshot = this._newNodes[id];
            // Drop snapshots that were garbage collected.
            if (newSnapshot === undefined) {
                delete snapshots[id];
            }
            else {
                // TODO: This should not be run for ParameterizedValueSnapshots
                if (entityTransformer) {
                    var data = this._newNodes[id].data;
                    if (data)
                        entityTransformer(data);
                }
                snapshots[id] = newSnapshot;
            }
        }
        return new GraphSnapshot_1.GraphSnapshot(snapshots);
    };
    /**
     * Transitively walks the inbound references of all edited nodes, rewriting
     * those references to point to the newly edited versions.
     */
    SnapshotEditor.prototype._rebuildInboundReferences = function () {
        var queue = Array.from(this._editedNodeIds);
        util_1.addToSet(this._rebuiltNodeIds, queue);
        while (queue.length) {
            var nodeId = queue.pop();
            var snapshot = this._getNodeSnapshot(nodeId);
            if (!(snapshot instanceof nodes_1.EntitySnapshot))
                continue;
            if (!snapshot || !snapshot.inbound)
                continue;
            try {
                for (var _a = tslib_1.__values(snapshot.inbound), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var _c = _b.value, id = _c.id, path = _c.path;
                    this._setValue(id, path, snapshot.data, false);
                    if (this._rebuiltNodeIds.has(id))
                        continue;
                    this._rebuiltNodeIds.add(id);
                    queue.push(id);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
        var e_3, _d;
    };
    /**
     * Transitively removes all orphaned nodes from the graph.
     */
    SnapshotEditor.prototype._removeOrphanedNodes = function (nodeIds) {
        var queue = Array.from(nodeIds);
        while (queue.length) {
            var nodeId = queue.pop();
            var node = this._getNodeSnapshot(nodeId);
            if (!node)
                continue;
            this._newNodes[nodeId] = undefined;
            this._editedNodeIds.add(nodeId);
            if (!node.outbound)
                continue;
            try {
                for (var _a = tslib_1.__values(node.outbound), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var _c = _b.value, id = _c.id, path = _c.path;
                    var reference = this._ensureNewSnapshot(id);
                    if (util_1.removeNodeReference('inbound', reference, nodeId, path)) {
                        queue.push(id);
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        var e_4, _d;
    };
    /**
     * Retrieve the _latest_ version of a node snapshot.
     */
    SnapshotEditor.prototype._getNodeSnapshot = function (id) {
        return id in this._newNodes ? this._newNodes[id] : this._parent.getNodeSnapshot(id);
    };
    /**
     * Retrieve the _latest_ version of a node.
     */
    SnapshotEditor.prototype._getNodeData = function (id) {
        var snapshot = this._getNodeSnapshot(id);
        return snapshot ? snapshot.data : undefined;
    };
    /**
     * Set `newValue` at `path` of the value snapshot identified by `id`, without
     * modifying the parent's copy of it.
     *
     * This will not shallow clone objects/arrays along `path` if they were
     * previously cloned during this transaction.
     */
    SnapshotEditor.prototype._setValue = function (id, path, newValue, isEdit) {
        if (isEdit === void 0) { isEdit = true; }
        if (isEdit) {
            this._editedNodeIds.add(id);
        }
        var parent = this._parent.getNodeSnapshot(id);
        var current = this._ensureNewSnapshot(id);
        current.data = util_1.lazyImmutableDeepSet(current.data, parent && parent.data, path, newValue);
    };
    /**
     * Ensures that we have built a new version of a snapshot for node `id` (and
     * that it is referenced by `_newNodes`).
     */
    SnapshotEditor.prototype._ensureNewSnapshot = function (id) {
        var parent;
        if (id in this._newNodes) {
            return this._newNodes[id];
        }
        else {
            parent = this._parent.getNodeSnapshot(id);
        }
        // TODO: We're assuming that the only time we call _ensureNewSnapshot when
        // there is no parent is when the node is an entity.  Can we enforce it, or
        // pass a type through?
        var newSnapshot = parent ? nodes_1.cloneNodeSnapshot(parent) : new nodes_1.EntitySnapshot();
        this._newNodes[id] = newSnapshot;
        return newSnapshot;
    };
    /**
     * Ensures that there is a ParameterizedValueSnapshot for the given node with
     * arguments
     */
    SnapshotEditor.prototype._ensureParameterizedValueSnapshot = function (containerId, path, args) {
        var fieldId = nodeIdForParameterizedValue(containerId, path, args);
        // We're careful to not edit the container unless we absolutely have to.
        // (There may be no changes for this parameterized value).
        var containerSnapshot = this._getNodeSnapshot(containerId);
        if (!containerSnapshot || !util_1.hasNodeReference(containerSnapshot, 'outbound', fieldId, path)) {
            // We need to construct a new snapshot otherwise.
            var newSnapshot = new nodes_1.ParameterizedValueSnapshot();
            util_1.addNodeReference('inbound', newSnapshot, containerId, path);
            this._newNodes[fieldId] = newSnapshot;
            // Ensure that the container points to it.
            util_1.addNodeReference('outbound', this._ensureNewSnapshot(containerId), fieldId, path);
        }
        return fieldId;
    };
    return SnapshotEditor;
}());
exports.SnapshotEditor = SnapshotEditor;
/**
 * Generate a stable id for a parameterized value.
 */
function nodeIdForParameterizedValue(containerId, path, args) {
    return containerId + "\u2756" + JSON.stringify(path) + "\u2756" + JSON.stringify(args);
}
exports.nodeIdForParameterizedValue = nodeIdForParameterizedValue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU25hcHNob3RFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTbmFwc2hvdEVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBMkM7QUFHM0Msb0NBQWdFO0FBQ2hFLGtEQUFpRDtBQUNqRCxrQ0FBdUc7QUFJdkcsZ0NBU2lCO0FBZ0NqQjs7Ozs7R0FLRztBQUNIO0lBd0JFO1FBQ0UsK0RBQStEO1FBQ3ZELFFBQXNCO1FBQzlCLHlDQUF5QztRQUNqQyxPQUFzQjtRQUZ0QixhQUFRLEdBQVIsUUFBUSxDQUFjO1FBRXRCLFlBQU8sR0FBUCxPQUFPLENBQWU7UUExQmhDOztXQUVHO1FBQ0ssY0FBUyxHQUFvQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXpEOzs7OztXQUtHO1FBQ0ssbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBRTNDOzs7V0FHRztRQUNLLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUU1Qyw0RUFBNEU7UUFDcEUsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztJQU9wRCxDQUFDO0lBRUo7OztPQUdHO0lBQ0gscUNBQVksR0FBWixVQUFhLEtBQW1CLEVBQUUsT0FBbUI7UUFDbkQsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbkQsa0VBQWtFO1FBQ2xFLHdEQUF3RDtRQUN4RCxJQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7UUFFOUIsNEVBQTRFO1FBQzVFLDBFQUEwRTtRQUMxRSxzRUFBc0U7UUFDdEUsb0NBQW9DO1FBQ3BDLElBQU0sY0FBYyxHQUFvQixFQUFFLENBQUM7UUFDM0MsSUFBSSxDQUFDLGNBQWMsQ0FDakIsRUFBRSxDQUFDLHNCQUFzQixFQUN6QixjQUFjLEVBQ2QsUUFBUSxFQUNSLE1BQU0sQ0FBQyxNQUFNLEVBQ2IsRUFBRSxDQUFDLGdCQUFnQixFQUNu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