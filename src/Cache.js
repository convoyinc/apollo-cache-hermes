"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var CacheSnapshot_1 = require("./CacheSnapshot");
var CacheTransaction_1 = require("./CacheTransaction");
var context_1 = require("./context");
var GraphSnapshot_1 = require("./GraphSnapshot");
var operations_1 = require("./operations");
var OptimisticUpdateQueue_1 = require("./OptimisticUpdateQueue");
/**
 * The Hermes cache.
 *
 * @see https://github.com/apollographql/apollo-client/issues/1971
 * @see https://github.com/apollographql/apollo-client/blob/2.0-alpha/src/data/cache.ts
 */
var Cache = /** @class */ (function () {
    function Cache(config) {
        /** All active query observers. */
        this._observers = [];
        var initialGraphSnapshot = new GraphSnapshot_1.GraphSnapshot();
        this._snapshot = new CacheSnapshot_1.CacheSnapshot(initialGraphSnapshot, initialGraphSnapshot, new OptimisticUpdateQueue_1.OptimisticUpdateQueue());
        this._context = new context_1.CacheContext(config);
    }
    Cache.prototype.transformDocument = function (document) {
        return this._context.transformDocument(document);
    };
    Cache.prototype.restore = function (data, migrationMap, verifyQuery) {
        var _a = operations_1.restore(data, this._context), cacheSnapshot = _a.cacheSnapshot, editedNodeIds = _a.editedNodeIds;
        var migrated = operations_1.migrate(cacheSnapshot, migrationMap);
        if (verifyQuery && !operations_1.read(this._context, verifyQuery, migrated.baseline).complete) {
            throw new Error("Restored cache cannot satisfy the verification query");
        }
        this._setSnapshot(migrated, editedNodeIds);
    };
    Cache.prototype.extract = function (optimistic, pruneQuery) {
        var cacheSnapshot = optimistic ? this._snapshot.optimistic : this._snapshot.baseline;
        return operations_1.extract(pruneQuery ? operations_1.prune(this._context, cacheSnapshot, pruneQuery).snapshot : cacheSnapshot, this._context);
    };
    Cache.prototype.evict = function (_query) {
        throw new Error("evict() is not implemented on Cache");
    };
    /**
     * Reads the selection expressed by a query from the cache.
     *
     * TODO: Can we drop non-optimistic reads?
     * https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
     */
    Cache.prototype.read = function (query, optimistic) {
        // TODO: Can we drop non-optimistic reads?
        // https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
        return operations_1.read(this._context, query, optimistic ? this._snapshot.optimistic : this._snapshot.baseline);
    };
    /**
     * Retrieves the current value of the entity identified by `id`.
     */
    Cache.prototype.getEntity = function (id) {
        return this._snapshot.optimistic.getNodeData(id);
    };
    /**
     * Registers a callback that should be triggered any time the nodes selected
     * by a particular query have changed.
     */
    Cache.prototype.watch = function (query, callback) {
        var _this = this;
        var observer = new operations_1.QueryObserver(this._context, query, this._snapshot.optimistic, callback);
        this._observers.push(observer);
        return function () { return _this._removeObserver(observer); };
    };
    /**
     * Writes values for a selection to the cache.
     */
    Cache.prototype.write = function (query, payload) {
        this.transaction(function (t) { return t.write(query, payload); });
    };
    Cache.prototype.transaction = function (changeIdOrCallback, callback) {
        var tracer = this._context.tracer;
        var changeId;
        if (typeof callback !== 'function') {
            callback = changeIdOrCallback;
        }
        else {
            changeId = changeIdOrCallback;
        }
        var tracerContext;
        if (tracer.transactionStart) {
            tracerContext = tracer.transactionStart();
        }
        var transaction = new CacheTransaction_1.CacheTransaction(this._context, this._snapshot, changeId);
        try {
            callback(transaction);
        }
        catch (error) {
            if (tracer.transactionEnd) {
                tracer.transactionEnd(error.toString(), tracerContext);
            }
            return false;
        }
        var _a = transaction.commit(), snapshot = _a.snapshot, editedNodeIds = _a.editedNodeIds;
        this._setSnapshot(snapshot, editedNodeIds);
        if (tracer.transactionEnd) {
            tracer.transactionEnd(undefined, tracerContext);
        }
        return true;
    };
    /**
     * Roll back a previously enqueued optimistic update.
     */
    Cache.prototype.rollback = function (changeId) {
        this.transaction(function (t) { return t.rollback(changeId); });
    };
    Cache.prototype.getSnapshot = function () {
        return this._snapshot;
    };
    /**
     * Resets all data tracked by the cache.
     */
    Cache.prototype.reset = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var allIds, baseline, optimistic, optimisticQueue;
            return tslib_1.__generator(this, function (_a) {
                allIds = new Set(this._snapshot.optimistic.allNodeIds());
                baseline = new GraphSnapshot_1.GraphSnapshot();
                optimistic = baseline;
                optimisticQueue = new OptimisticUpdateQueue_1.OptimisticUpdateQueue();
                this._setSnapshot(new CacheSnapshot_1.CacheSnapshot(baseline, optimistic, optimisticQueue), allIds);
                return [2 /*return*/];
            });
        });
    };
    // Internal
    /**
     * Unregister an observer.
     */
    Cache.prototype._removeObserver = function (observer) {
        var index = this._observers.findIndex(function (o) { return o === observer; });
        if (index < 0)
            return;
        this._observers.splice(index, 1);
    };
    /**
     * Point the cache to a new snapshot, and let observers know of the change.
     * Call onChange callback if one exist to notify cache users of any change.
     */
    Cache.prototype._setSnapshot = function (snapshot, editedNodeIds) {
        var lastSnapshot = this._snapshot;
        this._snapshot = snapshot;
        if (lastSnapshot) {
            try {
                for (var _a = tslib_1.__values(['baseline', 'optimistic']), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var key = _b.value;
                    try {
                        for (var _c = tslib_1.__values(lastSnapshot[key].readCache), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var _e = tslib_1.__read(_d.value, 2), operation = _e[0], result = _e[1];
                            if (result.complete && result.nodeIds) {
                                var changed = false;
                                try {
                                    for (var editedNodeIds_1 = tslib_1.__values(editedNodeIds), editedNodeIds_1_1 = editedNodeIds_1.next(); !editedNodeIds_1_1.done; editedNodeIds_1_1 = editedNodeIds_1.next()) {
                                        var nodeId = editedNodeIds_1_1.value;
                                        if (result.nodeIds.has(nodeId)) {
                                            changed = true;
                                            break;
                                        }
                                    }
                                }
                                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                                finally {
                                    try {
                                        if (editedNodeIds_1_1 && !editedNodeIds_1_1.done && (_f = editedNodeIds_1.return)) _f.call(editedNodeIds_1);
                                    }
                                    finally { if (e_1) throw e_1.error; }
                                }
                                if (!changed) {
                                    this._snapshot[key].readCache.set(operation, result);
                                }
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_g = _c.return)) _g.call(_c);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_h = _a.return)) _h.call(_a);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
        var tracerContext;
        if (this._context.tracer.broadcastStart) {
            tracerContext = this._context.tracer.broadcastStart({ snapshot: snapshot, editedNodeIds: editedNodeIds });
        }
        try {
            for (var _j = tslib_1.__values(this._observers), _k = _j.next(); !_k.done; _k = _j.next()) {
                var observer = _k.value;
                observer.consumeChanges(snapshot.optimistic, editedNodeIds);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_k && !_k.done && (_l = _j.return)) _l.call(_j);
            }
            finally { if (e_4) throw e_4.error; }
        }
        if (this._context.onChange) {
            this._context.onChange(this._snapshot, editedNodeIds);
        }
        if (this._context.tracer.broadcastEnd) {
            this._context.tracer.broadcastEnd({ snapshot: snapshot, editedNodeIds: editedNodeIds }, tracerContext);
        }
        var e_3, _h, e_2, _g, e_1, _f, e_4, _l;
    };
    return Cache;
}());
exports.Cache = Cache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxpREFBZ0Q7QUFDaEQsdURBQXNEO0FBQ3RELHFDQUF5QztBQUN6QyxpREFBZ0Q7QUFDaEQsMkNBQW1HO0FBQ25HLGlFQUFnRTtBQVFoRTs7Ozs7R0FLRztBQUNIO0lBV0UsZUFBWSxNQUFtQztRQUgvQyxrQ0FBa0M7UUFDMUIsZUFBVSxHQUFvQixFQUFFLENBQUM7UUFHdkMsSUFBTSxvQkFBb0IsR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztRQUNqRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksNkJBQWEsQ0FBQyxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLDZDQUFxQixFQUFFLENBQUMsQ0FBQztRQUM1RyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksc0JBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsaUNBQWlCLEdBQWpCLFVBQWtCLFFBQXNCO1FBQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRCx1QkFBTyxHQUFQLFVBQVEsSUFBZ0MsRUFBRSxZQUEyQixFQUFFLFdBQTBCO1FBQ3pGLElBQUEsOENBQStELEVBQTdELGdDQUFhLEVBQUUsZ0NBQWEsQ0FBa0M7UUFDdEUsSUFBTSxRQUFRLEdBQUcsb0JBQU8sQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdEQsRUFBRSxDQUFDLENBQUMsV0FBVyxJQUFJLENBQUMsaUJBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNqRixNQUFNLElBQUksS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUNELElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCx1QkFBTyxHQUFQLFVBQVEsVUFBbUIsRUFBRSxVQUF5QjtRQUNwRCxJQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUN2RixNQUFNLENBQUMsb0JBQU8sQ0FDWixVQUFVLENBQUMsQ0FBQyxDQUFDLGtCQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxhQUFhLEVBQUUsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxhQUFhLEVBQ3JGLElBQUksQ0FBQyxRQUFRLENBQ2QsQ0FBQztJQUNKLENBQUM7SUFFRCxxQkFBSyxHQUFMLFVBQU0sTUFBb0I7UUFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILG9CQUFJLEdBQUosVUFBSyxLQUFtQixFQUFFLFVBQW9CO1FBQzVDLDBDQUEwQztRQUMxQyxvRkFBb0Y7UUFDcEYsTUFBTSxDQUFDLGlCQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN0RyxDQUFDO0lBRUQ7O09BRUc7SUFDSCx5QkFBUyxHQUFULFVBQVUsRUFBVTtRQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRDs7O09BR0c7SUFDSCxxQkFBSyxHQUFMLFVBQU0sS0FBbUIsRUFBRSxRQUFzQztRQUFqRSxpQkFLQztRQUpDLElBQU0sUUFBUSxHQUFHLElBQUksMEJBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM5RixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUUvQixNQUFNLENBQUMsY0FBTSxPQUFBLEtBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQTlCLENBQThCLENBQUM7SUFDOUMsQ0FBQztJQUVEOztPQUVHO0lBQ0gscUJBQUssR0FBTCxVQUFNLEtBQW1CLEVBQUUsT0FBbUI7UUFDNUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxFQUF2QixDQUF1QixDQUFDLENBQUM7SUFDakQsQ0FBQztJQWFELDJCQUFXLEdBQVgsVUFBWSxrQkFBa0QsRUFBRSxRQUE4QjtRQUNwRixJQUFBLDZCQUFNLENBQW1CO1FBRWpDLElBQUksUUFBUSxDQUFDO1FBQ2IsRUFBRSxDQUFDLENBQUMsT0FBTyxRQUFRLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNuQyxRQUFRLEdBQUcsa0JBQXlDLENBQUM7UUFDdkQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sUUFBUSxHQUFHLGtCQUE4QixDQUFDO1FBQzVDLENBQUM7UUFFRCxJQUFJLGFBQWEsQ0FBQztRQUNsQixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQzVCLGFBQWEsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUM1QyxDQUFDO1FBRUQsSUFBTSxXQUFXLEdBQUcsSUFBSSxtQ0FBZ0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDbEYsSUFBSSxDQUFDO1lBQ0gsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2YsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUVLLElBQUEseUJBQWtELEVBQWhELHNCQUFRLEVBQUUsZ0NBQWEsQ0FBMEI7UUFDekQsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFFM0MsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7O09BRUc7SUFDSCx3QkFBUSxHQUFSLFVBQVMsUUFBa0I7UUFDekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQXBCLENBQW9CLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBRUQsMkJBQVcsR0FBWDtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7T0FFRztJQUNHLHFCQUFLLEdBQVg7Ozs7Z0JBQ1EsTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7Z0JBRXpELFFBQVEsR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztnQkFDL0IsVUFBVSxHQUFHLFFBQVEsQ0FBQztnQkFDdEIsZUFBZSxHQUFHLElBQUksNkNBQXFCLEVBQUUsQ0FBQztnQkFFcEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLDZCQUFhLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxlQUFlLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQzs7OztLQUNyRjtJQUVELFdBQVc7SUFFWDs7T0FFRztJQUNLLCtCQUFlLEdBQXZCLFVBQXdCLFFBQXVCO1FBQzdDLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxLQUFLLFFBQVEsRUFBZCxDQUFjLENBQUMsQ0FBQztRQUM3RCxFQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ssNEJBQVksR0FBcEIsVUFBcUIsUUFBdUIsRUFBRSxhQUEwQjtRQUN0RSxJQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBRTFCLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7O2dCQUNqQixHQUFHLENBQUMsQ0FBYyxJQUFBLEtBQUEsaUJBQUEsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUEsZ0JBQUE7b0JBQXZDLElBQU0sR0FBRyxXQUFBOzt3QkFDWixHQUFHLENBQUMsQ0FBOEIsSUFBQSxLQUFBLGlCQUFBLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUEsZ0JBQUE7NEJBQWxELElBQUEsZ0NBQW1CLEVBQWxCLGlCQUFTLEVBQUUsY0FBTTs0QkFDM0IsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQ0FDdEMsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDOztvQ0FDcEIsR0FBRyxDQUFDLENBQWlCLElBQUEsa0JBQUEsaUJBQUEsYUFBYSxDQUFBLDRDQUFBO3dDQUE3QixJQUFNLE1BQU0sMEJBQUE7d0NBQ2YsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRDQUMvQixPQUFPLEdBQUcsSUFBSSxDQUFDOzRDQUNmLEtBQUssQ0FBQzt3Q0FDUixDQUFDO3FDQUNGOzs7Ozs7Ozs7Z0NBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29DQUNiLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0NBQ3ZELENBQUM7NEJBQ0gsQ0FBQzt5QkFDRjs7Ozs7Ozs7O2lCQUNGOzs7Ozs7Ozs7UUFDSCxDQUFDO1FBRUQsSUFBSSxhQUFhLENBQUM7UUFDbEIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUN4QyxhQUFhLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsUUFBUSxVQUFBLEVBQUUsYUFBYSxlQUFBLEVBQUUsQ0FBQyxDQUFDO1FBQ25GLENBQUM7O1lBRUQsR0FBRyxDQUFDLENBQW1CLElBQUEsS0FBQSxpQkFBQSxJQUFJLENBQUMsVUFBVSxDQUFBLGdCQUFBO2dCQUFqQyxJQUFNLFFBQVEsV0FBQTtnQkFDakIsUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO2FBQzdEOzs7Ozs7Ozs7UUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRSxRQUFRLFVBQUEsRUFBRSxhQUFhLGVBQUEsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7O0lBQ0gsQ0FBQztJQUVILFlBQUM7QUFBRCxDQUFDLEFBN01ELElBNk1DO0FBN01ZLHNCQUFLIn0=