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
    Cache.prototype.restore = function (data) {
        var _a = operations_1.restore(data, this._context), cacheSnapshot = _a.cacheSnapshot, editedNodeIds = _a.editedNodeIds;
        this._setSnapshot(cacheSnapshot, editedNodeIds);
    };
    Cache.prototype.extract = function (optimistic) {
        if (optimistic) {
            return operations_1.extract(this._snapshot.optimistic, this._context);
        }
        return operations_1.extract(this._snapshot.baseline, this._context);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxpREFBZ0Q7QUFDaEQsdURBQXNEO0FBQ3RELHFDQUF5QztBQUN6QyxpREFBZ0Q7QUFDaEQsMkNBQXFFO0FBQ3JFLGlFQUFnRTtBQU9oRTs7Ozs7R0FLRztBQUNIO0lBV0UsZUFBWSxNQUFtQztRQUgvQyxrQ0FBa0M7UUFDMUIsZUFBVSxHQUFvQixFQUFFLENBQUM7UUFHdkMsSUFBTSxvQkFBb0IsR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztRQUNqRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksNkJBQWEsQ0FBQyxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLDZDQUFxQixFQUFFLENBQUMsQ0FBQztRQUM1RyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksc0JBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsaUNBQWlCLEdBQWpCLFVBQWtCLFFBQXNCO1FBQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRCx1QkFBTyxHQUFQLFVBQVEsSUFBZ0M7UUFDaEMsSUFBQSw4Q0FBK0QsRUFBN0QsZ0NBQWEsRUFBRSxnQ0FBYSxDQUFrQztRQUN0RSxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsdUJBQU8sR0FBUCxVQUFRLFVBQW1CO1FBQ3pCLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDZixNQUFNLENBQUMsb0JBQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUNELE1BQU0sQ0FBQyxvQkFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMs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