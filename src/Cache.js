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
        this._snapshot = snapshot;
        var tracerContext;
        if (this._context.tracer.broadcastStart) {
            tracerContext = this._context.tracer.broadcastStart({ snapshot: snapshot, editedNodeIds: editedNodeIds });
        }
        try {
            for (var _a = tslib_1.__values(this._observers), _b = _a.next(); !_b.done; _b = _a.next()) {
                var observer = _b.value;
                observer.consumeChanges(snapshot.optimistic, editedNodeIds);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (this._context.onChange) {
            this._context.onChange(this._snapshot, editedNodeIds);
        }
        if (this._context.tracer.broadcastEnd) {
            this._context.tracer.broadcastEnd({ snapshot: snapshot, editedNodeIds: editedNodeIds }, tracerContext);
        }
        var e_1, _c;
    };
    return Cache;
}());
exports.Cache = Cache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxpREFBZ0Q7QUFDaEQsdURBQXNEO0FBQ3RELHFDQUF5QztBQUN6QyxpREFBZ0Q7QUFDaEQsMkNBQW1HO0FBQ25HLGlFQUFnRTtBQVNoRTs7Ozs7R0FLRztBQUNIO0lBV0UsZUFBWSxNQUFtQztRQUgvQyxrQ0FBa0M7UUFDMUIsZUFBVSxHQUFvQixFQUFFLENBQUM7UUFHdkMsSUFBTSxvQkFBb0IsR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztRQUNqRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksNkJBQWEsQ0FBQyxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLDZDQUFxQixFQUFFLENBQUMsQ0FBQztRQUM1RyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksc0JBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsaUNBQWlCLEdBQWpCLFVBQWtCLFFBQXNCO1FBQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRCx1QkFBTyxHQUFQLFVBQVEsSUFBZ0MsRUFBRSxZQUEyQixFQUFFLFdBQTBCO1FBQ3pGLElBQUEsOENBQStELEVBQTdELGdDQUFhLEVBQUUsZ0NBQWEsQ0FBa0M7UUFDdEUsSUFBTSxRQUFRLEdBQUcsb0JBQU8sQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdEQsRUFBRSxDQUFDLENBQUMsV0FBVyxJQUFJLENBQUMsaUJBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNqRixNQUFNLElBQUksS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUNELElBQUksQ0FB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