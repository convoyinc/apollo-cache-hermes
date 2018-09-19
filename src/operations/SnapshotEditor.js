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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU25hcHNob3RFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTbmFwc2hvdEVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBMkM7QUFHM0Msb0NBQWdFO0FBQ2hFLGtEQUFpRDtBQUNqRCxrQ0FBdUc7QUFJdkcsZ0NBU2lCO0FBOEJqQjs7Ozs7R0FLRztBQUNIO0lBd0JFO0lBQ0UsK0RBQStEO0lBQ3ZELFFBQXNCO0lBQzlCLHlDQUF5QztJQUNqQyxPQUFzQjtRQUZ0QixhQUFRLEdBQVIsUUFBUSxDQUFjO1FBRXRCLFlBQU8sR0FBUCxPQUFPLENBQWU7UUExQmhDOztXQUVHO1FBQ0ssY0FBUyxHQUFvQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXpEOzs7OztXQUtHO1FBQ0ssbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBRTNDOzs7V0FHRztRQUNLLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUU1Qyw0RUFBNEU7UUFDcEUsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztJQU9wRCxDQUFDO0lBRUo7OztPQUdHO0lBQ0gscUNBQVksR0FBWixVQUFhLEtBQW1CLEVBQUUsT0FBbUI7UUFDbkQsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbkQsa0VBQWtFO1FBQ2xFLHdEQUF3RDtRQUN4RCxJQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7UUFFOUIsNEVBQTRFO1FBQzVFLDBFQUEwRTtRQUMxRSxzRUFBc0U7UUFDdEUsb0NBQW9DO1FBQ3BDLElBQU0sY0FBYyxHQUFvQixFQUFFLENBQUM7UUFDM0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxVQUFVLEVBQUUsTUFB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