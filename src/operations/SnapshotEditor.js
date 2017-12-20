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
        this._mergeSubgraph(referenceEdits, warnings, parsed.rootId, [] /* prefixPath */, [] /* path */, parsed.parsedQuery, payload);
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
    SnapshotEditor.prototype._mergeSubgraph = function (referenceEdits, warnings, containerId, prefixPath, path, parsed, payload) {
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
            this._mergeArraySubgraph(referenceEdits, warnings, containerId, prefixPath, path, parsed, payload, previousValue);
            return;
        }
        var payloadId = this._context.entityIdForValue(payload);
        var previousId = this._context.entityIdForValue(previousValue);
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
        // If we've entered a new node; it becomes our container.
        if (payloadId) {
            prefixPath = tslib_1.__spread(prefixPath, path);
            containerId = payloadId;
            path = [];
        }
        // Finally, we can walk into individual values.
        for (var payloadName in parsed) {
            var node = parsed[payloadName];
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
            var fieldPath = tslib_1.__spread(path, [node.isStatic ? payloadName : schemaName]);
            if (node.args && !node.isStatic) {
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
                this._mergeSubgraph(referenceEdits, warnings, containerIdForField, fieldPrefixPath, fieldPath, node.children, fieldValue);
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
    SnapshotEditor.prototype._mergeArraySubgraph = function (referenceEdits, warnings, containerId, prefixPath, path, parsed, payload, previousValue) {
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
            this._mergeSubgraph(referenceEdits, warnings, containerId, prefixPath, tslib_1.__spread(path, [i]), parsed, childPayload);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU25hcHNob3RFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTbmFwc2hvdEVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBMkM7QUFHM0Msb0NBQWdFO0FBQ2hFLGtEQUFpRDtBQUNqRCxrQ0FBdUc7QUFJdkcsZ0NBU2lCO0FBOEJqQjs7Ozs7R0FLRztBQUNIO0lBd0JFO1FBQ0UsK0RBQStEO1FBQ3ZELFFBQXNCO1FBQzlCLHlDQUF5QztRQUNqQyxPQUFzQjtRQUZ0QixhQUFRLEdBQVIsUUFBUSxDQUFjO1FBRXRCLFlBQU8sR0FBUCxPQUFPLENBQWU7UUExQmhDOztXQUVHO1FBQ0ssY0FBUyxHQUFvQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXpEOzs7OztXQUtHO1FBQ0ssbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBRTNDOzs7V0FHRztRQUNLLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUU1Qyw0RUFBNEU7UUFDcEUsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztJQU9wRCxDQUFDO0lBRUo7OztPQUdHO0lBQ0gscUNBQVksR0FBWixVQUFhLEtBQW1CLEVBQUUsT0FBbUI7UUFDbkQsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbkQsa0VBQWtFO1FBQ2xFLHdEQUF3RDtRQUN4RCxJQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7UUFFOUIsNEVBQTRFO1FBQzVFLDBFQUEwRTtRQUMxRSxzRUFBc0U7UUFDdEUsb0NBQW9DO1FBQ3BDLElBQU0sY0FBYyxHQUFvQixFQUFFLENBQUM7UUFDM0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxVQUFVLEVBQUUsTUFB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